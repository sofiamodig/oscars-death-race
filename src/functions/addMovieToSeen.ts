import { MoviesYearsListType, SeenMoviesType, SeenType } from "@/types";
import { checkLatestYear } from "@/utils";
import { supabase } from "@/supabase";
import { DateTime } from "luxon";

interface Props {
  imdbId: string;
  userId: string;
  year: string;
  movies: MoviesYearsListType;
  seenMovies: SeenMoviesType[];
  predictions: boolean;
}

export const addMovieToSeenFunc = async ({
  imdbId,
  userId,
  year,
  movies,
  seenMovies,
  predictions,
}: Props) => {
  const yearNumber = Number(year);
  const movieYear = movies.find((entry) => entry.year === year);
  const yearMovies = movieYear?.movies ?? [];
  const now = DateTime.now().toUTC().toISO();
  if (!now) throw new Error("Could not create a seen date.");

  const { error } = await supabase.from("seen_movies").upsert(
    { user_id: userId, year: yearNumber, imdb_id: imdbId, seen_at: now },
    { onConflict: "user_id,year,imdb_id" }
  );
  if (error) throw error;

  const priorSeen = seenMovies.find((entry) => entry.year === year)?.seenMovies ?? [];
  const seenIds = new Set(
    priorSeen
      .filter((item) => yearMovies.some((movie) => movie.imdbId === item.imdbId))
      .map((item) => item.imdbId)
  );
  seenIds.add(imdbId);
  const isComplete =
    yearMovies.length > 0 &&
    seenIds.size >= yearMovies.length &&
    (!checkLatestYear(year, movies) || !predictions);

  if (isComplete) {
    const { error: progressError } = await supabase
      .from("user_year_progress")
      .upsert(
        { user_id: userId, year: yearNumber, completed_at: now },
        { onConflict: "user_id,year" }
      );
    if (progressError) throw progressError;
  }

  const result: SeenType = { imdbId, date: now };
  const existingYear = seenMovies.find((entry) => entry.year === year);
  if (existingYear) {
    return seenMovies.map((entry) =>
      entry.year === year
        ? {
            ...entry,
            seenMovies: [
              ...entry.seenMovies.filter((item) => item.imdbId !== imdbId),
              result,
            ],
            ...(isComplete ? { completed: now } : {}),
          }
        : entry
    );
  }

  return [
    ...seenMovies,
    {
      year,
      seenMovies: [result],
      ...(isComplete ? { completed: now } : {}),
    },
  ];
};
