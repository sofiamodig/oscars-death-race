import { supabase } from "@/supabase";
import { SeenMoviesType, UserSettingsType } from "@/types";

export const fetchSeenMovies = async (userId: string) => {
  const pageSize = 1000;
  const seenRows = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("seen_movies")
      .select("year, imdb_id, seen_at")
      .eq("user_id", userId)
      .order("year", { ascending: true })
      .order("imdb_id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Failed to load your seen movies: ${error.message}`);
    const page = data ?? [];
    seenRows.push(...page);
    if (page.length < pageSize) break;
  }

  const [progressResult, profileResult] = await Promise.all([
    supabase
      .from("user_year_progress")
      .select("year, completed_at")
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .select("username, show_in_leaderboard, percentage_by_watch_time, movie_link_destination")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const error = progressResult.error ?? profileResult.error;
  if (error) throw new Error(`Failed to load your data: ${error.message}`);

  const byYear = new Map<number, SeenMoviesType>();
  for (const row of seenRows) {
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
    movieLinkDestination: profile?.movie_link_destination ?? "imdb",
  };

  return {
    years: Array.from(byYear.values()).sort(
      (a, b) => Number(a.year) - Number(b.year)
    ),
    settings,
  };
};
