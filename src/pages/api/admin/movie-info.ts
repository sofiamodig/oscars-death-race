import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAdmin } from "@/server/supabaseAdmin";

type OmdbMovie = {
  Response?: string;
  Error?: string;
  imdbID?: string;
  Title?: string;
  Poster?: string;
  Director?: string;
  Actors?: string;
  Runtime?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { user, error } = await authenticateAdmin(req);
  if (!user) return res.status(403).json({ error });

  const imdbId = String(req.body?.imdbId ?? "").trim();
  const title = String(req.body?.title ?? "").trim();
  const year = String(req.body?.year ?? "").trim();
  if (imdbId && !/^tt\d+$/.test(imdbId)) {
    return res.status(400).json({ error: "A valid IMDb ID is required." });
  }
  if (!imdbId && (!title || title.length > 200)) {
    return res.status(400).json({ error: "Enter a movie title to search." });
  }

  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "The OMDb API key is not configured." });

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set(imdbId ? "i" : "t", imdbId || title);
  if (!imdbId && /^\d{4}$/.test(year)) url.searchParams.set("y", year);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: "OMDb could not be reached." });
    }

    const movie = (await response.json()) as OmdbMovie;
    if (movie.Response === "False" || !movie.imdbID) {
      return res.status(404).json({ error: movie.Error ?? "Movie not found in OMDb." });
    }

    return res.status(200).json({
      imdbID: movie.imdbID,
      Title: movie.Title ?? "",
      Poster: movie.Poster ?? "N/A",
      Director: movie.Director ?? "N/A",
      Actors: movie.Actors ?? "N/A",
      Runtime: movie.Runtime ?? "N/A",
    });
  } catch {
    return res.status(502).json({ error: "Could not search OMDb for this movie." });
  }
}
