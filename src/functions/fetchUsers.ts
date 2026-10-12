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
