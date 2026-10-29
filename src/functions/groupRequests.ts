import { supabase } from "@/supabase";

export type LeaderboardGroup = {
  id: string;
  name: string;
  created_by: string;
  isOwner: boolean;
  members: { id: string; username: string; status: "member" | "pending" }[];
};

export type GroupInvitation = {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  alreadyMember: boolean;
};

type GroupUserSearchResult = {
  id: string;
  username: string;
  show_in_leaderboard: boolean;
};

const groupRequest = async (path: string, method: "GET" | "POST", body?: Record<string, unknown>) => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in to use groups.");
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Group request failed.");
  return result;
};

export const fetchGroups = async (): Promise<{ groups: LeaderboardGroup[]; invitations: GroupInvitation[] }> =>
  groupRequest("/api/groups", "GET");

export const searchGroupUsers = async (query: string): Promise<GroupUserSearchResult[]> => {
  const result = await groupRequest(`/api/groups?q=${encodeURIComponent(query)}`, "GET");
  return result.users;
};

export const updateGroup = (body: Record<string, unknown>) =>
  groupRequest("/api/groups", "POST", body);

export const fetchGroupLeaderboard = async (groupId: string, year: string): Promise<{
  users: LeaderboardUser[];
}> => groupRequest(
  `/api/groups/${encodeURIComponent(groupId)}/leaderboard?year=${encodeURIComponent(year)}`,
  "GET"
);

export type LeaderboardUser = {
  id: string;
  username: string;
  seen: number;
  percentage: number;
  completed?: string | null;
  pending?: boolean;
};
