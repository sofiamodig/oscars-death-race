import { MoviesYearsListType } from "@/types";
import { BLOCKED_USERS } from "@/utils";
import { supabase } from "@/supabase";

export type LeaderboardUser = {
  username: string;
  id: string;
  seen: number;
  percentage: number;
  completed?: string | null;
  seenDuration?: number;
};

export interface LeaderboardType {
  [year: string]: LeaderboardUser[];
}

export type RacerCountsByYear = Record<string, number>;

type LeaderboardRow = {
  year: number;
  username: string;
  public_id: string;
  seen: number;
  percentage: number;
  completed: string | null;
  seen_duration: number;
};

export const fetchUsers = async (_movies?: MoviesYearsListType) => {
  const { data, error } = await supabase.rpc("get_public_leaderboard");
  if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);

  const usersByYear: LeaderboardType = {};
  for (const row of (data ?? []) as LeaderboardRow[]) {
    if (!row.username || BLOCKED_USERS.includes(row.username)) continue;
    const year = String(row.year);
    usersByYear[year] ??= [];
    usersByYear[year].push({
      username: row.username,
      id: row.public_id,
      seen: Number(row.seen),
      percentage: Number(row.percentage),
      completed: row.completed ?? null,
      seenDuration: Number(row.seen_duration ?? 0),
    });
  }
  return usersByYear;
};

export const fetchRacerCountsByYear = async (): Promise<RacerCountsByYear> => {
  const { data, error } = await supabase.rpc("get_racer_counts_by_year");
  if (error) throw new Error(`Failed to fetch racer counts: ${error.message}`);

  return Object.fromEntries(
    (data ?? []).map((row) => [String(row.year), Number(row.racer_count)]),
  );
};

export const fetchLeaderboardUsernames = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc("get_public_leaderboard_usernames");
  if (error) throw new Error(`Failed to fetch leaderboard usernames: ${error.message}`);

  return (data?.[0]?.usernames ?? []).filter(
    (username) => !BLOCKED_USERS.includes(username),
  );
};

export type PublicUserSeenData = {
  username: string;
  years: { year: string; seen: number }[];
};

type PublicUserSeenRow = {
  username: string;
  year: number;
  seen: number;
};

export const fetchPublicUserSeenData = async (
  username: string,
): Promise<PublicUserSeenData | null> => {
  const { data, error } = await supabase.rpc("get_public_user_seen_by_year", {
    p_username: username,
  });
  if (error) throw new Error(`Failed to fetch ${username}'s statistics: ${error.message}`);

  const rows = (data ?? []) as PublicUserSeenRow[];
  if (rows.length === 0) return null;

  return {
    username: rows[0].username,
    years: rows.map((row) => ({
      year: String(row.year),
      seen: Number(row.seen),
    })),
  };
};

export const fetchUsersForYear = async (year: number): Promise<LeaderboardUser[]> => {
  const { data, error } = await supabase.rpc("get_public_leaderboard_year", {
    p_year: year,
  });
  if (error) throw new Error(`Failed to fetch leaderboard for ${year}: ${error.message}`);

  return mapYearRows((data?.[0]?.leaderboard ?? []) as LeaderboardRow[]);
};

type InitialLeaderboardPayload = {
  year_leaderboard: LeaderboardRow[];
  all_time_leaderboard: {
    username: string;
    public_id: string;
    seen: number;
    percentage: number;
  }[];
};

const mapYearRows = (rows: LeaderboardRow[]): LeaderboardUser[] =>
  rows
    .filter((row) => row.username && !BLOCKED_USERS.includes(row.username))
    .map((row) => ({
      username: row.username,
      id: row.public_id,
      seen: Number(row.seen),
      percentage: Number(row.percentage),
      completed: row.completed ?? null,
      seenDuration: Number(row.seen_duration ?? 0),
    }));

export const fetchLeaderboardInitial = async (year: number) => {
  const { data, error } = await supabase.rpc("get_public_leaderboard_initial", {
    p_year: year,
  });
  if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);

  const payload = data?.[0] as InitialLeaderboardPayload | undefined;
  const allTimeUsers = (payload?.all_time_leaderboard ?? [])
    .filter((row) => row.username && !BLOCKED_USERS.includes(row.username))
    .map((row) => ({
      id: row.public_id,
      username: row.username,
      seen: Number(row.seen),
      percentage: Number(row.percentage),
    }))
    .sort((a, b) => b.seen - a.seen)
    .slice(0, 100);

  return {
    yearUsers: mapYearRows(payload?.year_leaderboard ?? []),
    allTimeUsers,
  };
};
