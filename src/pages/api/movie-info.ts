import type { NextApiRequest, NextApiResponse } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import type { MoviesYearsListType } from "@/types";

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
  if (!apiKey) return res.status(500).json({ error: "The OMDb API key is not configured." });

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("i", imdbId);
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: "OMDb could not be reached." });
    }

    const movie = (await response.json()) as OmdbMovie;
    if (movie.Response === "False") {
      res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
      return res.status(404).json({ error: movie.Error ?? "Movie details are not available." });
    }

    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).json({
      imdbRating: movie.imdbRating ?? "N/A",
      imdbVotes: movie.imdbVotes ?? "N/A",
      Rated: movie.Rated ?? "N/A",
      Released: movie.Released ?? "N/A",
      Runtime: movie.Runtime ?? "N/A",
      Genre: movie.Genre ?? "N/A",
      Plot: movie.Plot ?? "N/A",
      Awards: movie.Awards ?? "N/A",
    });
  } catch {
    return res.status(502).json({ error: "Could not load movie details from OMDb." });
  }
}
