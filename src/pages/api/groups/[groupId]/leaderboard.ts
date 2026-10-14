import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, getAdminClient } from "@/server/supabaseAdmin";

type MovieRow = { year: number; imdb_id: string; duration: number | null };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const { user, error } = await authenticateRequest(req);
  if (!user) return res.status(401).json({ error });
  const groupId = String(req.query.groupId ?? "");
  const year = String(req.query.year ?? "");
  if (!groupId || (year !== "all" && !/^\d{4}$/.test(year))) {
    return res.status(400).json({ error: "A group and valid year are required." });
  }

  const client = getAdminClient();
  const { data: members, error: membersError } = await client
    .from("leaderboard_group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (membersError) return res.status(500).json({ error: membersError.message });
  const userIds = [...new Set((members ?? []).map((member) => member.user_id))];
  if (!userIds.includes(user.id)) return res.status(403).json({ error: "You are not a member of this group." });
  if (userIds.length === 0) return res.status(200).json({ users: [] });

  const { data: invitations, error: invitationError } = await client
    .from("leaderboard_group_invitations")
    .select("invited_user_id")
    .eq("group_id", groupId);
  if (invitationError) return res.status(500).json({ error: invitationError.message });
  const pendingUserIds = [...new Set((invitations ?? [])
    .map((invitation) => invitation.invited_user_id)
    .filter((invitedUserId) => !userIds.includes(invitedUserId)))];
  const profilesForRanking = [...new Set([...userIds, ...pendingUserIds])];

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select("id, username, percentage_by_watch_time")
    .in("id", profilesForRanking);
  if (profilesError) return res.status(500).json({ error: profilesError.message });
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const movies: MovieRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client.from("movies").select("year, imdb_id, duration").order("year").range(offset, offset + 999);
    if (year !== "all") query = query.eq("year", Number(year));
    const { data, error: moviesError } = await query;
    if (moviesError) return res.status(500).json({ error: moviesError.message });
    movies.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const movieMap = new Map(movies.map((movie) => [`${movie.year}:${movie.imdb_id}`, movie]));
  const movieCount = movies.length;
  const totalDuration = movies.reduce((total, movie) => total + (movie.duration ?? 0), 0);
  const selectedYears = [...new Set(movies.map((movie) => movie.year))];

  const seenRows: { user_id: string; year: number; imdb_id: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client.from("seen_movies").select("user_id, year, imdb_id").in("user_id", userIds)
      .order("year").range(offset, offset + 999);
    if (year !== "all") query = query.eq("year", Number(year));
    const { data, error: seenError } = await query;
    if (seenError) return res.status(500).json({ error: seenError.message });
    seenRows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const seenByUser = new Map<string, Set<string>>();
  for (const row of seenRows) {
    const movieKey = `${row.year}:${row.imdb_id}`;
    if (!movieMap.has(movieKey)) continue;
    const seen = seenByUser.get(row.user_id) ?? new Set<string>();
    seen.add(movieKey);
    seenByUser.set(row.user_id, seen);
  }

  const completionRows: { user_id: string; year: number; completed_at: string }[] = [];
  let completionQuery = client.from("user_year_progress")
    .select("user_id, year, completed_at").in("user_id", userIds);
  if (year === "all") {
    if (selectedYears.length) completionQuery = completionQuery.in("year", selectedYears);
  } else {
    completionQuery = completionQuery.eq("year", Number(year));
  }
  const { data: completions, error: completionError } = await completionQuery;
  if (completionError) return res.status(500).json({ error: completionError.message });
  completionRows.push(...(completions ?? []));
  const completionsByUser = new Map<string, string>();
  for (const row of completionRows) {
    const current = completionsByUser.get(row.user_id);
    if (!current || row.completed_at < current) completionsByUser.set(row.user_id, row.completed_at);
  }

  const users = userIds.flatMap((userId) => {
    const profile = profilesById.get(userId);
    if (!profile?.username) return [];
    const seenKeys = seenByUser.get(userId) ?? new Set<string>();
    const seen = seenKeys.size;
    const seenDuration = [...seenKeys].reduce((total, key) => total + (movieMap.get(key)?.duration ?? 0), 0);
    const percentage = profile.percentage_by_watch_time
      ? (totalDuration ? Math.round((seenDuration / totalDuration) * 100) : 0)
      : (movieCount ? Math.round((seen / movieCount) * 100) : 0);
    return [{
      id: userId,
      username: profile.username,
      seen,
      percentage,
      completed: completionsByUser.get(userId) ?? null,
    }];
  }).sort((a, b) => b.seen - a.seen || (a.completed ?? "9999").localeCompare(b.completed ?? "9999"));

  const pendingUsers = pendingUserIds.flatMap((userId) => {
    const profile = profilesById.get(userId);
    return profile?.username
      ? [{ id: userId, username: profile.username, seen: 0, percentage: 0, pending: true }]
      : [];
  }).sort((a, b) => a.username.localeCompare(b.username));

  return res.status(200).json({ users: [...users, ...pendingUsers] });
}
