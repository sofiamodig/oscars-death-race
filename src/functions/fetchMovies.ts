import { supabase } from "@/supabase";
import { MovieType, MoviesYearsListType } from "@/types";

type MovieRow = {
  year: number;
  imdb_id: string;
  tmdb_id: string | null;
  simkl_id: number | null;
  title: string;
  director: string | null;
  duration: number | null;
  poster_url: string | null;
  categories: string[] | null;
  won_categories: string[] | null;
  cast_members: string[] | null;
};

export const fetchMovies = async (): Promise<MoviesYearsListType> => {
  const pageSize = 1000;
  const rows: MovieRow[] = [];

  // Supabase caps the number of rows returned by each request. Keep requesting
  // ranges until an empty page is returned so catalogs larger than that cap
  // aren't silently truncated.
  for (let offset = 0; ; ) {
    const { data, error } = await supabase
      .from("movies")
      .select(
        "year, imdb_id, tmdb_id, simkl_id, title, director, duration, poster_url, categories, won_categories, cast_members"
      )
      .order("year", { ascending: true })
      .order("title", { ascending: true })
      .order("imdb_id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch movies: ${error.message}`);
    }

    const page = (data ?? []) as MovieRow[];
    if (page.length === 0) break;

    rows.push(...page);
    offset += page.length;
  }

  const moviesByYear = new Map<string, MovieType[]>();

  for (const row of rows) {
    const year = String(row.year);
    const movie: MovieType = {
      // Existing app code uses this ID for seen-movie lookups.
      id: row.imdb_id,
      imdbId: row.imdb_id,
      ...(row.tmdb_id ? { tmdbId: row.tmdb_id } : {}),
      ...(row.simkl_id !== null ? { simklId: row.simkl_id } : {}),
      title: row.title,
      director: row.director ?? "",
      cast: (row.cast_members ?? []).join(", "),
      categories: row.categories ?? [],
      wonCategories: row.won_categories ?? [],
      posterUrl: row.poster_url ?? "",
      ...(typeof row.duration === "number" ? { duration: row.duration } : {}),
    };

    const yearMovies = moviesByYear.get(year) ?? [];
    yearMovies.push(movie);
    moviesByYear.set(year, yearMovies);
  }

  return Array.from(moviesByYear, ([year, movies]) => ({ year, movies }));
};
