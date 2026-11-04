import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("NEXT_SUPABASE_URL and NEXT_SUPABASE_ANON_KEY are required to build the movie catalog.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const pageSize = 1000;
const rows = [];

for (let offset = 0; ; offset += pageSize) {
  const { data, error } = await supabase
    .from("movies")
    .select("year, imdb_id, tmdb_id, letterboxd_id, simkl_id, title, director, duration, poster_url, categories, won_categories, cast_members")
    .order("year", { ascending: true })
    .order("title", { ascending: true })
    .order("imdb_id", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) throw new Error(`Failed to generate movie catalog: ${error.message}`);
  const page = data ?? [];
  rows.push(...page);
  if (page.length < pageSize) break;
}

if (rows.length === 0) {
  throw new Error("The movie query returned no rows; refusing to generate an empty catalog.");
}

const moviesByYear = new Map();
for (const row of rows) {
  const year = String(row.year);
  const movie = {
    id: row.imdb_id,
    imdbId: row.imdb_id,
    ...(row.tmdb_id ? { tmdbId: row.tmdb_id } : {}),
    ...(row.letterboxd_id ? { letterboxdId: row.letterboxd_id } : {}),
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

const movies = Array.from(moviesByYear, ([year, yearMovies]) => ({ year, movies: yearMovies }));
const outputPath = path.join(process.cwd(), "public", "movies.json");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(movies));
console.log(`Generated ${outputPath} with ${rows.length} movies across ${movies.length} years.`);
