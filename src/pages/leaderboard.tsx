import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import { MoviesYearsListType } from "@/types";
import { fetchMovies } from "@/functions/fetchMovies";
import { useSeenContext } from "@/contexts/seenContext";
import { Heading } from "@/components/heading";
import { LeaderboardItem } from "@/components/leaderboardItem";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Loader } from "@/styles/Loader";
import { getYearsList } from "@/utils";
import {
  LeaderboardType,
  LeaderboardUser,
  fetchLeaderboardInitial,
  fetchUsersForYear,
} from "@/functions/fetchUsers";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/components/button";
import { TextInput } from "@/components/textInput";
import { Modal } from "@/components/modal";
import {
  fetchGroupLeaderboard,
  fetchGroups,
  GroupInvitation,
  LeaderboardGroup,
  searchGroupUsers,
  updateGroup,
} from "@/functions/groupRequests";

const groupTabClasses = (active: boolean) => `flex-[0_0_auto] cursor-pointer whitespace-nowrap border-0 border-b-[3px] px-[14px] py-[10px] mb-[-1px] bg-transparent font-[inherit] hover:text-[#897b2c] ${active ? "border-[#bb9c38] font-semibold text-[#897b2c]" : "border-transparent text-neutral-700"}`;
const redLinkClasses = "cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-red-600 underline hover:text-[#8f1b13] focus-visible:text-[#8f1b13]";

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  const totalNrOfMovies = movies.map((year) => year.movies).flat().length;
  const latestYear = Number(movies.at(-1)?.year);
  if (!latestYear) throw new Error("No movie years are available for the leaderboard.");

  const { yearUsers: latestYearUsers, allTimeUsers: allUsers } =
    await fetchLeaderboardInitial(latestYear);
  const leaderboard = { [String(latestYear)]: latestYearUsers };

  return {
    props: {
      movies,
      leaderboard,
      allUsers,
      totalNrOfMovies: totalNrOfMovies,
    },
    revalidate: 86400,
  };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
  leaderboard: LeaderboardType;
  allUsers: {
    id: string;
    username: string;
    seen: number;
    percentage: number;
  }[];
  totalNrOfMovies: number;
}>;

export default function Leaderboard({
  movies,
  leaderboard,
  allUsers,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [selectedYear, setSelectedYear] = useState<string>();
  const [yearLeaderboard, setYearLeaderboard] = useState<LeaderboardUser[]>();
  const [usersList, setUsersList] = useState<LeaderboardUser[]>();
  const [isYearLoading, setIsYearLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string>();
  const leaderboardCache = useRef(leaderboard);
  const { seenMovies, userSettings, loading } = useSeenContext();
  const { yearsList } = getYearsList(movies);
  const [groups, setGroups] = useState<LeaderboardGroup[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchGroupUsers>>>([]);
  const [groupStatus, setGroupStatus] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<"create" | "edit">("create");

  const refreshGroups = async (preferredGroupId?: string) => {
    const data = await fetchGroups();
    setGroups(data.groups);
    setInvitations(data.invitations);
    setSelectedGroupId((current) => {
      if (preferredGroupId && data.groups.some((group) => group.id === preferredGroupId)) return preferredGroupId;
      if (current && data.groups.some((group) => group.id === current)) return current;
      return data.groups[0]?.id || "";
    });
  };

  useEffect(() => {
    let active = true;
    fetchGroups()
      .then((data) => {
        if (!active) return;
        setGroups(data.groups);
        setInvitations(data.invitations);
        setSelectedGroupId((current) => current || data.groups[0]?.id || "");
        setGroupsError("");
      })
      .catch((error: unknown) => {
        if (active) setGroupsError(error instanceof Error ? error.message : "Could not load groups.");
      })
      .finally(() => { if (active) setGroupsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const managedGroup = groups.find((group) => group.id === selectedGroupId);
    if (memberSearch.trim().length < 2 || !isGroupModalOpen || !managedGroup?.isOwner) {
      setSearchResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      searchGroupUsers(memberSearch.trim())
        .then((results) => { if (active) setSearchResults(results); })
        .catch((error: unknown) => { if (active) setGroupStatus(error instanceof Error ? error.message : "Could not search users."); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [memberSearch, selectedGroupId, groups, isGroupModalOpen]);

  useEffect(() => {
    if (!selectedYear) return;

    if (!showAllUsers && selectedGroupId) {
      let cancelled = false;
      setUsersList(undefined);
      setYearLeaderboard(undefined);
      setIsYearLoading(true);
      setLeaderboardError(undefined);
      fetchGroupLeaderboard(selectedGroupId, selectedYear)
        .then(({ users }) => { if (!cancelled) setUsersList(users); })
        .catch((error: unknown) => {
          if (!cancelled) setLeaderboardError(error instanceof Error ? error.message : "Could not load this group leaderboard.");
        })
        .finally(() => { if (!cancelled) setIsYearLoading(false); });
      return () => { cancelled = true; };
    }

    if (selectedYear === "all") {
      setUsersList(allUsers);
      setYearLeaderboard([]);
      setIsYearLoading(false);
      setLeaderboardError(undefined);
    } else if (selectedYear) {
      setUsersList(undefined);
      const cachedUsers = leaderboardCache.current[selectedYear];
      if (cachedUsers) {
        setYearLeaderboard(cachedUsers);
        setIsYearLoading(false);
        setLeaderboardError(undefined);
        return;
      }

      let cancelled = false;
      setYearLeaderboard(undefined);
      setIsYearLoading(true);
      setLeaderboardError(undefined);
      fetchUsersForYear(Number(selectedYear))
        .then((users) => {
          if (!cancelled) {
            leaderboardCache.current[selectedYear] = users;
            setYearLeaderboard(users);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setLeaderboardError(
              error instanceof Error ? error.message : "Could not load this leaderboard."
            );
          }
        })
        .finally(() => {
          if (!cancelled) setIsYearLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [selectedYear, allUsers, showAllUsers, selectedGroupId]);

  const yearMovies = useMemo(
    () => movies.find((movie) => movie.year === selectedYear)?.movies ?? [],
    [movies, selectedYear]
  );

  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear(yearsList[0].value);
    }
  }, [yearsList, selectedYear]);

  useEffect(() => {
    if (!showAllUsers && selectedGroupId) return;
    if (selectedYear === "all") {
      return;
    }

    const updatedUsersList =
      yearLeaderboard?.map((user, i) => {
        if (user.username === userSettings?.username) {
          const seenMoviesImdbIds = seenMovies
            ?.find((list) => list.year === selectedYear)
            ?.seenMovies.map((movie) => movie.imdbId);
          const uniqueSeenMoviesImdbIds = new Set(seenMoviesImdbIds);

          const seenCount =
            yearMovies?.filter((movie) =>
              uniqueSeenMoviesImdbIds.has(movie.imdbId)
            ).length ?? 0;
          const totalMovies = yearMovies?.length ?? 0;
          const percentage =
            totalMovies > 0 ? Math.round((seenCount / totalMovies) * 100) : 0;

          return {
            ...user,
            seen: seenCount,
            percentage: percentage,
          };
        } else {
          return user;
        }
      }) ?? [];

    const sortedUsersList = [...updatedUsersList]
      ?.sort((a, b) => {
        if (a.seen > b.seen) {
          return -1;
        } else if (a.seen < b.seen) {
          return 1;
        } else {
          const dateA = a.completed
            ? DateTime.fromISO(a.completed)
            : DateTime.now();
          const dateB = b.completed
            ? DateTime.fromISO(b.completed)
            : DateTime.now();
          return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
        }
      })
      .filter((user) => user.username);

    setUsersList(sortedUsersList);
  }, [
    selectedYear,
    yearLeaderboard,
    seenMovies,
    userSettings?.username,
    yearMovies,
    showAllUsers,
    selectedGroupId,
  ]);

  const createGroup = async () => {
    setGroupStatus("");
    try {
      const result = await updateGroup({ action: "create", name: newGroupName });
      setNewGroupName("");
      await refreshGroups(result.group.id);
      setShowAllUsers(false);
      setGroupModalMode("edit");
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : "Could not create group.");
    }
  };

  const inviteUser = async (username: string) => {
    setGroupStatus("");
    try {
      const result = await updateGroup({ action: "invite", groupId: selectedGroupId, username });
      setGroupStatus(`Invitation sent to ${username}.`);
      setMemberSearch("");
      setSearchResults([]);
      await refreshGroups();
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : "Could not add this user.");
    }
  };

  const respondToInvitation = async (
    invitation: GroupInvitation,
    action: "accept" | "reject" | "dismiss" | "leave"
  ) => {
    setGroupStatus("");
    try {
      const accept = action === "accept";
      await updateGroup({
        action: "respond",
        invitationId: invitation.id,
        accept,
        dismiss: action === "dismiss",
        leave: action === "leave",
      });
      await refreshGroups(accept ? invitation.groupId : undefined);
      window.dispatchEvent(new Event("group-invitations-changed"));
      if (accept) setShowAllUsers(false);
      setGroupStatus(
        action === "accept" ? "You joined the group." :
          action === "reject" ? "Invitation declined." :
            action === "leave" ? "You left the group." : "Invitation dismissed."
      );
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : "Could not update invitation.");
    }
  };

  const removeGroupMember = async (userId: string, username: string) => {
    if (!selectedGroup || !window.confirm(`Remove ${username} from ${selectedGroup.name}?`)) return;
    setGroupStatus("");
    try {
      await updateGroup({ action: "removeMember", groupId: selectedGroup.id, userId });
      await refreshGroups();
      setGroupStatus(`${username} was removed from the group.`);
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : "Could not remove this member.");
    }
  };

  const leaveGroup = async () => {
    if (!selectedGroup || !window.confirm(`Leave ${selectedGroup.name}?`)) return;
    setGroupStatus("");
    try {
      await updateGroup({ action: "leaveGroup", groupId: selectedGroup.id });
      await refreshGroups();
      setIsGroupModalOpen(false);
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : "Could not leave this group.");
    }
  };

  const deleteGroup = async () => {
    if (!selectedGroup || !window.confirm(`Delete ${selectedGroup.name} and remove all its members?`)) return;
    setGroupStatus("");
    try {
      await updateGroup({ action: "deleteGroup", groupId: selectedGroup.id });
      await refreshGroups();
      setIsGroupModalOpen(false);
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : "Could not delete this group.");
    }
  };

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <Box $maxWidth="980px" $marginLeft="auto" $marginRight="auto">
      <Flex $marginBottom="4" $alignItems="flex-start">
        <div>
          <Heading as="h1" size="xl" marginBottom="2">
            Leaderboard
          </Heading>
          <Paragraph size="sm">
            The leaderboard is updated once per day. The interval is shortened
            closer to the oscars.
          </Paragraph>
          {/* <Paragraph size="sm">
            The leaderboard is updated every 20 minutes.
          </Paragraph> */}
          {selectedYear === "all" && (
            <Paragraph size="sm">
              All years are combined to the ultimate race! 🏆 In total there are{" "}
              {movies.map((year) => year.movies).flat().length} movies to watch.
              This list shows the top 100 users.
            </Paragraph>
          )}
        </div>
        <div
          className="custom-select-wrapper"
          style={{ width: "120px", flexShrink: "0" }}
        >
          <select onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="all">All years</option>
            {yearsList.map((year, i) => (
              <option key={year.value} value={year.value} selected={i === 0}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
      </Flex>
      {invitations.length > 0 && (
        <Box id="invitations" $marginBottom="8">
          <Heading size="md" marginBottom="4">Group invitations ({invitations.length})</Heading>
          {invitations.map((invitation) => (
            <Flex key={invitation.id} $alignItems="center" $gap="4" $marginBottom="4">
              {invitation.alreadyMember ? (
                <>
                  <Paragraph>You have been invited to {invitation.groupName}. It is already in your groups.</Paragraph>
                  <Button label="Got it" size="sm" onClick={() => respondToInvitation(invitation, "dismiss")} />
                  <Button label="Leave group" size="sm" variant="secondary" onClick={() => respondToInvitation(invitation, "leave")} />
                </>
              ) : (
                <>
                  <Paragraph>{invitation.invitedBy} invited you to {invitation.groupName}.</Paragraph>
                  <Button label="Accept" size="sm" onClick={() => respondToInvitation(invitation, "accept")} />
                  <Button label="Reject" size="sm" variant="secondary" onClick={() => respondToInvitation(invitation, "reject")} />
                </>
              )}
            </Flex>
          ))}
        </Box>
      )}
      <Box $marginBottom="8">
        <div className="flex items-end gap-2 max-[600px]:flex-col max-[600px]:items-stretch">
          <div className="mb-4 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto border-b border-neutral-300 max-[600px]:mb-0 max-[600px]:w-full" role="tablist" aria-label="Choose a leaderboard">
            {groups.map((group) => (
              <button
                className={groupTabClasses(!showAllUsers && selectedGroupId === group.id)}
                key={group.id}
                type="button"
                role="tab"
                aria-selected={!showAllUsers && selectedGroupId === group.id}
                onClick={() => { setSelectedGroupId(group.id); setShowAllUsers(false); }}
              >
                {group.name}
              </button>
            ))}
            <button
              className={groupTabClasses(showAllUsers || (!selectedGroupId && groups.length === 0))}
              type="button"
              role="tab"
              aria-selected={showAllUsers || (!selectedGroupId && groups.length === 0)}
              onClick={() => setShowAllUsers(true)}
            >
              Full leaderboard
            </button>
          </div>
          <button
            className="mb-4 flex-[0_0_auto] cursor-pointer whitespace-nowrap rounded border border-[#bb9c38] bg-transparent px-3 py-[7px] text-[#bb9c38] hover:border-[#897b2c] hover:text-[#897b2c] max-[600px]:self-start"
            type="button"
            onClick={() => {
              setGroupModalMode("create");
              setNewGroupName("");
              setGroupStatus("");
              setIsGroupModalOpen(true);
            }}
          >
            + Add new group
          </button>
        </div>
        {groupsError && <Paragraph>{groupsError}</Paragraph>}
        {(groupStatus || (groupsLoading && !groupsError)) && <Paragraph>{groupStatus || "Loading groups…"}</Paragraph>}
      </Box>
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} maxWidth="520px">
        <Heading size="lg" marginBottom="6">
          {groupModalMode === "create" ? "Add a new group" : selectedGroup?.name || ''}
        </Heading>
        <Flex $direction="column" $alignItems="flex-start" $gap="6">
          {groupModalMode === "create" && (
            <Flex $alignItems="flex-end" $gap="4" style={{ width: "100%" }}>
              <TextInput label="New group name" value={newGroupName} setValue={setNewGroupName} />
              <Button label="Create" onClick={createGroup} disabled={!newGroupName.trim()} />
            </Flex>
          )}
          {groupModalMode === "edit" && selectedGroup && (
            <Box $width="100%">
              <Heading size="xs" marginBottom="2">Members:</Heading>
              {selectedGroup.members.map((member) => (
                <Flex key={member.id} $alignItems="center" $justifyContent="space-between" $marginBottom="6">
                  <Paragraph>
                    {member.username}{member.status === "pending" ? " · Pending invitation" : ""}
                  </Paragraph>
                  {selectedGroup.isOwner && member.id !== selectedGroup.created_by && (
                    <Button
                      label={member.status === "pending" ? "Cancel invite" : "Remove"}
                      size="sm"
                      variant="danger"
                      onClick={() => removeGroupMember(member.id, member.username)}
                    />
                  )}
                </Flex>
              ))}
              {selectedGroup.isOwner ? (
                <div className="relative w-full">
                  <TextInput
                    label="Search usernames to invite"
                    placeholder="Type at least 2 characters"
                    value={memberSearch}
                    setValue={setMemberSearch}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute inset-x-0 top-[calc(100%_+_4px)] z-[3] max-h-[220px] overflow-y-auto rounded border border-neutral-300 bg-white shadow-[0_4px_12px_rgb(0_0_0_/_12%)]" role="listbox" aria-label="Username search results">
                      {searchResults.map((result) => (
                        <button
                          className="flex w-full cursor-pointer items-center justify-between border-0 bg-white px-3 py-2.5 text-left text-neutral-900 hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none"
                          type="button"
                          key={result.id}
                          role="option"
                          onClick={() => inviteUser(result.username)}
                        >
                          <span>{result.username}</span>
                          <span>{result.show_in_leaderboard ? "Invite" : "Invite · hidden profile"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Paragraph>You are a member of this group.</Paragraph>
                  <button className={redLinkClasses} onClick={leaveGroup}>Leave group</button>
                </>
              )}
              {selectedGroup.isOwner && (
                <Box $marginTop="6">
                  <button className={redLinkClasses} onClick={deleteGroup}>
                    Delete group
                  </button>
                </Box>
              )}
            </Box>
          )}
          {groupStatus && <Paragraph>{groupStatus}</Paragraph>}
          <Button label="Done" variant="secondary" onClick={() => setIsGroupModalOpen(false)} />
        </Flex>
      </Modal>
      {loading || isYearLoading ? (
        <Flex $justifyContent="center" $marginTop="8">
          <Loader />
        </Flex>
      ) : leaderboardError ? (
        <Paragraph>{leaderboardError}</Paragraph>
      ) : (
        <div>
          {usersList?.map((user, i) => {
            return (
              <LeaderboardItem
                key={selectedYear + user.id}
                username={user.username ?? "unknown"}
                percentage={user.percentage}
                completed={
                  parseInt(selectedYear ?? "0") > 2020 ? user.completed : null
                }
                seen={selectedYear === "all" ? user.seen : undefined}
                isCurrentUser={user.username === userSettings?.username}
                isPending={user.pending}
                rank={i}
              />
            );
          })}
        </div>
      )}
      {!groupsLoading && !showAllUsers && selectedGroup && (
        <Box $marginTop="8">
          {selectedGroup.isOwner ? (
            <Button
              label="Manage group"
              variant="secondary"
              size="sm"
              onClick={() => {
                setGroupModalMode("edit");
                setGroupStatus("");
                setIsGroupModalOpen(true);
              }}
            />
          ) : (
            <button type="button" className={redLinkClasses} onClick={leaveGroup}>
              Leave group
            </button>
          )}
        </Box>
      )}
    </Box>
  );
}
