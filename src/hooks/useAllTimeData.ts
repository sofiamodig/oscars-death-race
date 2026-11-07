import { useContext, useMemo } from "react";
import { SeenContext } from "@/contexts/seenContext";
import { useAuth } from "@/hooks/useAuth";
import { useMovieCatalog } from "@/hooks/useMovieCatalog";
import { cleanupCategory, prettifyCategory, sortCategories } from "@/utils";
import { MovieType } from "@/types";

export type AllTimeMovie = MovieType & { year: string };
export type MoviesByCategory = Record<string, { year: string; movies: MovieType[] }[]>;

const transformData = (movieYears: { year: string; movies: MovieType[] }[]) => {
  const result: MoviesByCategory = {};
  movieYears.forEach(({ year, movies }) => {
    movies.forEach((movie) => movie.categories?.forEach((category) => {
      if (category === "HONORARY AWARD" || category.includes("SPECIAL ACHIEVEMENT")) return;
      const key = cleanupCategory(category);
      result[key] ??= [];
      let yearEntry = result[key].find((entry) => entry.year === year);
      if (!yearEntry) {
        yearEntry = { year, movies: [] };
        result[key].push(yearEntry);
      }
      yearEntry.movies.push(movie);
    }));
  });
  return result;
};

export const useAllTimeData = () => {
  const { movies: catalog, loading: catalogLoading, error } = useMovieCatalog();
  const movies = useMemo(() => [...(catalog ?? [])].reverse(), [catalog]);
  const moviesPerCategory = useMemo(() => transformData(movies), [movies]);
  const allMovies = useMemo<AllTimeMovie[]>(
    () => movies.flatMap(({ year, movies: yearMovies }) => yearMovies.map((movie) => ({ ...movie, year }))),
    [movies]
  );
  const allMovieIds = useMemo(() => allMovies.map((movie) => movie.imdbId), [allMovies]);
  const { seenMovies, loading: seenLoading, addMovieToSeen, removeMovieFromSeen, userSettings } = useContext(SeenContext);
  const { isSignedIn } = useAuth();
  const allSeenMovies = useMemo(
    () => Array.from(new Set(seenMovies.flatMap((year) => year.seenMovies))).filter((movie) => allMovieIds.includes(movie?.imdbId)),
    [seenMovies, allMovieIds]
  );
  const allSeenMovieIds = useMemo(() => allSeenMovies.map((movie) => movie.imdbId), [allSeenMovies]);
  const categories = useMemo(
    () => sortCategories(Object.keys(moviesPerCategory)).map((value) => ({ value, label: prettifyCategory(value) })),
    [moviesPerCategory]
  );
  return {
    movies, allMovies, moviesPerCategory, allMovieIds, allSeenMovies, allSeenMovieIds,
    categories, isSignedIn, loading: catalogLoading || seenLoading, error,
    addMovieToSeen, removeMovieFromSeen, userSettings,
  };
};
