import { supabase } from "@/supabase";
import { SeenMoviesType, UserSettingsType } from "@/types";

export const fetchSeenMovies = async (userId: string) => {
  const [seenResult, progressResult, profileResult] = await Promise.all([
    supabase
      .from("seen_movies")
      .select("year, imdb_id, seen_at")
      .eq("user_id", userId)
      .order("year", { ascending: true }),
    supabase
      .from("user_year_progress")
      .select("year, completed_at")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("username, show_in_leaderboard, percentage_by_watch_time")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const error = seenResult.error ?? progressResult.error ?? profileResult.error;
  if (error) throw new Error(`Failed to load your data: ${error.message}`);

  const byYear = new Map<number, SeenMoviesType>();
  for (const row of seenResult.data ?? []) {
    const year = Number(row.year);
    const entry = byYear.get(year) ?? { year: String(year), seenMovies: [] };
    entry.seenMovies.push({ imdbId: row.imdb_id, date: row.seen_at });
    byYear.set(year, entry);
  }

  for (const row of progressResult.data ?? []) {
    const year = Number(row.year);
    const entry = byYear.get(year) ?? { year: String(year), seenMovies: [] };
    entry.completed = row.completed_at;
    byYear.set(year, entry);
  }

  const profile = profileResult.data;
  const settings: UserSettingsType = {
    username: profile?.username ?? "",
    showInLeaderboard: profile?.show_in_leaderboard ?? true,
    percentageByWatchTime: profile?.percentage_by_watch_time ?? false,
  };

  return {
    years: Array.from(byYear.values()).sort(
      (a, b) => Number(a.year) - Number(b.year)
    ),
    settings,
  };
};
