import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import type { MoviesYearsListType } from "@/types";
import { fetchSimklMovieDetails } from "@/server/movieExternalIds";

type OmdbMovie = {
  Response?: string;
  Error?: string;
  imdbRating?: string;
  imdbVotes?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Plot?: string;
  Awards?: string;
};

const asString = (value: unknown, fallback = "N/A") =>
  value === undefined || value === null || value === "" ? fallback : String(value);

const cacheMovieInfo = (res: NextApiResponse) => {
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
};

let movieCatalog: MoviesYearsListType | undefined;

const isCatalogMovie = (imdbId: string) => {
  if (!movieCatalog) {
    const catalogPath = join(process.cwd(), "public", "movies.json");
    movieCatalog = JSON.parse(readFileSync(catalogPath, "utf8")) as MoviesYearsListType;
  }
  return movieCatalog.some((year) =>
    year.movies.some((movie) => movie.imdbId === imdbId)
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const imdbId = typeof req.query.imdbId === "string" ? req.query.imdbId.trim() : "";
  if (!/^tt\d+$/.test(imdbId)) {
    return res.status(400).json({ error: "A valid IMDb ID is required." });
  }

  try {
    if (!isCatalogMovie(imdbId)) {
      return res.status(404).json({ error: "Movie not found in this catalog." });
    }
  } catch {
    return res.status(500).json({ error: "Could not load the movie catalog." });
  }

  const apiKey = process.env.OMDB_API_KEY;
  let omdbError = "OMDb is unavailable.";
  try {
    if (!apiKey) {
      omdbError = "The OMDb API key is not configured.";
    } else {
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("i", imdbId);
      url.searchParams.set("apikey", apiKey);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`OMDb returned HTTP ${response.status}.`);

      const movie = (await response.json()) as OmdbMovie;
      if (movie.Response !== "False") {
        cacheMovieInfo(res);
        return res.status(200).json({
          imdbRating: movie.imdbRating ?? "N/A",
          imdbVotes: movie.imdbVotes ?? "N/A",
          Rated: movie.Rated ?? "N/A",
          Released: movie.Released ?? "N/A",
          Runtime: movie.Runtime ?? "N/A",
          Genre: movie.Genre ?? "N/A",
          Plot: movie.Plot ?? "N/A",
          Awards: movie.Awards ?? "N/A",
          source: "OMDb",
          ratingSource: "IMDb",
        });
      }
      omdbError = movie.Error ?? "OMDb did not have details for this movie.";
    }
  } catch (error) {
    omdbError = error instanceof Error ? error.message : "Could not load movie details from OMDb.";
  }

  try {
    const movie = await fetchSimklMovieDetails(imdbId);
    const hasImdbRating = movie.imdbRating !== undefined && movie.imdbRating !== null;
    const rating = hasImdbRating ? movie.imdbRating : movie.simklRating;
    const ratingVotes = hasImdbRating ? movie.imdbVotes : movie.simklVotes;
    cacheMovieInfo(res);
    return res.status(200).json({
      imdbRating: asString(rating),
      imdbVotes: asString(ratingVotes, ""),
      Rated: asString(movie.certification),
      Released: asString(movie.released),
      Runtime: movie.runtime ? `${movie.runtime} min` : "N/A",
      Genre: movie.genres?.length ? movie.genres.join(", ") : "N/A",
      Plot: asString(movie.overview),
      source: "Simkl",
      ratingSource: hasImdbRating ? "IMDb" : movie.simklRating !== undefined ? "Simkl" : "IMDb",
      simklId: movie.simklId,
    });
  } catch (error) {
    const simklError = error instanceof Error ? error.message : "Could not load movie details from Simkl.";
    return res.status(502).json({ error: `Movie details unavailable. OMDb: ${omdbError} Simkl: ${simklError}` });
  }
}
