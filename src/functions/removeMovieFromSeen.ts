import { SeenMoviesType } from "@/types";
import { supabase } from "@/supabase";

interface Props {
  imdbId: string;
  userId: string;
  year: string;
  seenMovies: SeenMoviesType[];
}

export const removeMovieFromSeenFunc = async ({
  imdbId,
  userId,
  year,
  seenMovies,
}: Props) => {
  const yearNumber = Number(year);
  const { error } = await supabase
    .from("seen_movies")
    .delete()
    .eq("user_id", userId)
    .eq("year", yearNumber)
    .eq("imdb_id", imdbId);
  if (error) throw error;

  // Current behavior resets the completion date whenever a movie is removed.
  const { error: progressError } = await supabase
    .from("user_year_progress")
    .delete()
    .eq("user_id", userId)
    .eq("year", yearNumber);
  if (progressError) throw progressError;

  return seenMovies.map((entry) =>
    entry.year === year
      ? {
          ...entry,
          seenMovies: entry.seenMovies.filter((movie) => movie.imdbId !== imdbId),
          completed: null,
        }
      : entry
  );
};
