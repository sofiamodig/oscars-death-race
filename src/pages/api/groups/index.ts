import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, getAdminClient } from "@/server/supabaseAdmin";

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, error } = await authenticateRequest(req);
  if (!user) return res.status(401).json({ error });
  const client = getAdminClient();

  if (req.method === "GET" && typeof req.query.q === "string") {
    const query = req.query.q.trim().slice(0, 32);
    if (query.length < 2) return res.status(200).json({ users: [] });
    const { data, error: searchError } = await client
      .from("profiles")
      .select("id, username, show_in_leaderboard")
      .ilike("username", `%${escapeLike(query)}%`)
      .neq("id", user.id)
      .limit(10);
    if (searchError) return res.status(500).json({ error: searchError.message });
    return res.status(200).json({ users: data ?? [] });
  }

  if (req.method === "GET") {
    const { data: memberships, error: membershipsError } = await client
      .from("leaderboard_group_members")
      .select("group_id")
      .eq("user_id", user.id);
    if (membershipsError) return res.status(500).json({ error: membershipsError.message });
    const groupIds = (memberships ?? []).map((entry) => entry.group_id);
    const groups = groupIds.length
      ? await client.from("leaderboard_groups").select("id, name, created_by, created_at").in("id", groupIds).order("created_at", { ascending: true })
      : { data: [], error: null };
    if (groups.error) return res.status(500).json({ error: groups.error.message });

    const membersResult = groupIds.length
      ? await client.from("leaderboard_group_members").select("group_id, user_id").in("group_id", groupIds)
      : { data: [], error: null };
    if (membersResult.error) return res.status(500).json({ error: membersResult.error.message });
    const activeMemberIds = [...new Set((membersResult.data ?? []).map((member) => member.user_id))];
    const outgoingInvitations = groupIds.length
      ? await client.from("leaderboard_group_invitations").select("group_id, invited_user_id").in("group_id", groupIds)
      : { data: [], error: null };
    if (outgoingInvitations.error) return res.status(500).json({ error: outgoingInvitations.error.message });
    const pendingInvitations = (outgoingInvitations.data ?? []).filter(
      (invite) => !activeMemberIds.includes(invite.invited_user_id)
    );
    const memberIds = [...new Set([
      ...activeMemberIds,
      ...pendingInvitations.map((invite) => invite.invited_user_id),
    ])];
    const profiles = memberIds.length
      ? await client.from("profiles").select("id, username, show_in_leaderboard").in("id", memberIds)
      : { data: [], error: null };
    if (profiles.error) return res.status(500).json({ error: profiles.error.message });
    const profilesById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));
    const membersByGroup = new Map<string, unknown[]>();
    for (const member of membersResult.data ?? []) {
      const list = membersByGroup.get(member.group_id) ?? [];
      const profile = profilesById.get(member.user_id);
      if (profile) list.push({ id: profile.id, username: profile.username, status: "member" });
      membersByGroup.set(member.group_id, list);
    }
    for (const invite of pendingInvitations) {
      const list = membersByGroup.get(invite.group_id) ?? [];
      const profile = profilesById.get(invite.invited_user_id);
      if (profile) list.push({ id: profile.id, username: profile.username, status: "pending" });
      membersByGroup.set(invite.group_id, list);
    }

    const { data: invitations, error: invitationsError } = await client
      .from("leaderboard_group_invitations")
      .select("id, group_id, invited_by, created_at")
      .eq("invited_user_id", user.id);
    if (invitationsError) return res.status(500).json({ error: invitationsError.message });
    const invitationGroupIds = [...new Set((invitations ?? []).map((invite) => invite.group_id))];
    const acceptedInvitations = invitationGroupIds.length
      ? await client.from("leaderboard_group_members").select("group_id")
          .eq("user_id", user.id).in("group_id", invitationGroupIds)
      : { data: [], error: null };
    if (acceptedInvitations.error) return res.status(500).json({ error: acceptedInvitations.error.message });
    const acceptedGroupIds = new Set((acceptedInvitations.data ?? []).map((entry) => entry.group_id));
    const invitationGroups = invitationGroupIds.length
      ? await client.from("leaderboard_groups").select("id, name").in("id", invitationGroupIds)
      : { data: [], error: null };
    if (invitationGroups.error) return res.status(500).json({ error: invitationGroups.error.message });
    const invitationGroupNames = new Map((invitationGroups.data ?? []).map((group) => [group.id, group.name]));
    const inviterIds = [...new Set((invitations ?? []).map((invite) => invite.invited_by))];
    const inviters = inviterIds.length
      ? await client.from("profiles").select("id, username").in("id", inviterIds)
      : { data: [], error: null };
    if (inviters.error) return res.status(500).json({ error: inviters.error.message });
    const inviterNames = new Map((inviters.data ?? []).map((profile) => [profile.id, profile.username]));

    return res.status(200).json({
      groups: (groups.data ?? []).map((group) => ({
        ...group,
        isOwner: group.created_by === user.id,
        members: membersByGroup.get(group.id) ?? [],
      })),
      invitations: (invitations ?? []).map((invite) => ({
        id: invite.id,
        groupId: invite.group_id,
        groupName: invitationGroupNames.get(invite.group_id) ?? "Group",
        invitedBy: inviterNames.get(invite.invited_by) ?? "A user",
        alreadyMember: acceptedGroupIds.has(invite.group_id),
      })),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const action = String(req.body?.action ?? "");
  if (action === "deleteGroup") {
    const groupId = String(req.body?.groupId ?? "");
    const { data, error: deleteError } = await client
      .from("leaderboard_groups")
      .delete()
      .eq("id", groupId)
      .eq("created_by", user.id)
      .select("id");
    if (deleteError) return res.status(500).json({ error: deleteError.message });
    if (!data?.length) return res.status(404).json({ error: "Group not found or you are not its creator." });
    return res.status(200).json({ status: "deleted" });
  }

  if (action === "removeMember") {
    const groupId = String(req.body?.groupId ?? "");
    const memberId = String(req.body?.userId ?? "");
    const { data: group, error: groupError } = await client
      .from("leaderboard_groups")
      .select("created_by")
      .eq("id", groupId)
      .maybeSingle();
    if (groupError) return res.status(500).json({ error: groupError.message });
    if (!group || group.created_by !== user.id) return res.status(403).json({ error: "Only the group creator can remove other members." });
    if (memberId === user.id) return res.status(400).json({ error: "Delete the group if you want to remove yourself as its creator." });
    const { data, error: removeError } = await client
      .from("leaderboard_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", memberId)
      .select("user_id");
    if (removeError) return res.status(500).json({ error: removeError.message });
    if (!data?.length) {
      const { data: revokedInvite, error: revokeError } = await client
        .from("leaderboard_group_invitations")
        .delete()
        .eq("group_id", groupId)
        .eq("invited_user_id", memberId)
        .select("id");
      if (revokeError) return res.status(500).json({ error: revokeError.message });
      if (!revokedInvite?.length) return res.status(404).json({ error: "That user is not in the group." });
      return res.status(200).json({ status: "invitationRevoked" });
    }
    const { error: invitationError } = await client
      .from("leaderboard_group_invitations")
      .delete()
      .eq("group_id", groupId)
      .eq("invited_user_id", memberId);
    if (invitationError) return res.status(500).json({ error: invitationError.message });
    return res.status(200).json({ status: "removed" });
  }

  if (action === "leaveGroup") {
    const groupId = String(req.body?.groupId ?? "");
    const { data: group, error: groupError } = await client
      .from("leaderboard_groups")
      .select("created_by")
      .eq("id", groupId)
      .maybeSingle();
    if (groupError) return res.status(500).json({ error: groupError.message });
    if (!group) return res.status(404).json({ error: "Group not found." });
    if (group.created_by === user.id) return res.status(400).json({ error: "As the group creator, delete the group to remove it." });
    const { data, error: leaveError } = await client
      .from("leaderboard_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .select("user_id");
    if (leaveError) return res.status(500).json({ error: leaveError.message });
    if (!data?.length) return res.status(404).json({ error: "You are not a member of this group." });
    const { error: invitationError } = await client
      .from("leaderboard_group_invitations")
      .delete()
      .eq("group_id", groupId)
      .eq("invited_user_id", user.id);
    if (invitationError) return res.status(500).json({ error: invitationError.message });
    return res.status(200).json({ status: "left" });
  }

  if (action === "create") {
    const name = String(req.body?.name ?? "").trim();
    if (name.length < 1 || name.length > 40) {
      return res.status(400).json({ error: "Group names must be between 1 and 40 characters." });
    }
    const { data: group, error: createError } = await client
      .from("leaderboard_groups")
      .insert({ name, created_by: user.id })
      .select("id, name, created_by")
      .single();
    if (createError) return res.status(500).json({ error: createError.message });
    const { error: memberError } = await client.from("leaderboard_group_members").insert({
      group_id: group.id,
      user_id: user.id,
    });
    if (memberError) {
      await client.from("leaderboard_groups").delete().eq("id", group.id);
      return res.status(500).json({ error: memberError.message });
    }
    return res.status(201).json({ group: { ...group, isOwner: true, members: [] } });
  }

  if (action === "invite") {
    const groupId = String(req.body?.groupId ?? "");
    const username = String(req.body?.username ?? "").trim();
    if (!groupId || !username) return res.status(400).json({ error: "Choose a group and username." });
    const { data: group, error: groupError } = await client
      .from("leaderboard_groups")
      .select("id, created_by")
      .eq("id", groupId)
      .maybeSingle();
    if (groupError) return res.status(500).json({ error: groupError.message });
    if (!group || group.created_by !== user.id) return res.status(403).json({ error: "Only the group creator can invite members." });
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id, username, show_in_leaderboard")
      .ilike("username", escapeLike(username))
      .maybeSingle();
    if (profileError) return res.status(500).json({ error: profileError.message });
    if (!profile) return res.status(404).json({ error: "No user with that username was found." });
    if (profile.id === user.id) return res.status(400).json({ error: "You are already in your group." });

    const { data: existingMember, error: existingMemberError } = await client
      .from("leaderboard_group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (existingMemberError) return res.status(500).json({ error: existingMemberError.message });
    if (existingMember) return res.status(409).json({ error: "That user is already in the group." });

    if (profile.show_in_leaderboard) {
      const { error: addError } = await client.from("leaderboard_group_members").upsert(
        { group_id: groupId, user_id: profile.id },
        { onConflict: "group_id,user_id", ignoreDuplicates: true }
      );
      if (addError) return res.status(500).json({ error: addError.message });
    }

    const { error: inviteError } = await client.from("leaderboard_group_invitations").upsert(
      { group_id: groupId, invited_user_id: profile.id, invited_by: user.id },
      { onConflict: "group_id,invited_user_id" }
    );
    if (inviteError) return res.status(500).json({ error: inviteError.message });
    return res.status(200).json({ status: "invited", username: profile.username });
  }

  if (action === "respond") {
    const invitationId = String(req.body?.invitationId ?? "");
    const accept = req.body?.accept === true;
    const { data: invitation, error: invitationError } = await client
      .from("leaderboard_group_invitations")
      .select("id, group_id, invited_user_id")
      .eq("id", invitationId)
      .eq("invited_user_id", user.id)
      .maybeSingle();
    if (invitationError) return res.status(500).json({ error: invitationError.message });
    if (!invitation) return res.status(404).json({ error: "This invitation is no longer available." });

    const { data: currentMembership } = await client
      .from("leaderboard_group_members")
      .select("user_id")
      .eq("group_id", invitation.group_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (req.body?.leave === true) {
      if (!currentMembership) return res.status(409).json({ error: "Accept the invitation before leaving this group." });
      const { error: leaveError } = await client
        .from("leaderboard_group_members")
        .delete()
        .eq("group_id", invitation.group_id)
        .eq("user_id", user.id);
      if (leaveError) return res.status(500).json({ error: leaveError.message });
    } else if (req.body?.dismiss === true) {
      if (!currentMembership) return res.status(409).json({ error: "This invitation still needs your response." });
    } else if (accept) {
      const { error: joinError } = await client.from("leaderboard_group_members").upsert(
        { group_id: invitation.group_id, user_id: user.id },
        { onConflict: "group_id,user_id", ignoreDuplicates: true }
      );
      if (joinError) return res.status(500).json({ error: joinError.message });
    }
    const { error: removeError } = await client
      .from("leaderboard_group_invitations")
      .delete()
      .eq("id", invitation.id);
    if (removeError) return res.status(500).json({ error: removeError.message });
    return res.status(200).json({
      status: req.body?.leave === true ? "left" : req.body?.dismiss === true ? "dismissed" : accept ? "accepted" : "rejected",
    });
  }

  return res.status(400).json({ error: "Unknown group action." });
}
