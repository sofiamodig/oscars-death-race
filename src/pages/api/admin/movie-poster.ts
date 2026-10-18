import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAdmin } from "@/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { user, error } = await authenticateAdmin(req);
  if (!user) return res.status(403).json({ error });

  const imdbId = String(req.body?.imdbId ?? "").trim();
  if (!/^tt\d+$/.test(imdbId)) {
    return res.status(400).json({ error: "A valid IMDb ID is required." });
  }

  const apiKey = process.env.OMDB_API_KEY ?? process.env.NEXT_PUBLIC_OMDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "The OMDb API key is not configured." });

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(apiKey)}`
    );
    if (!response.ok) {
      return res.status(502).json({ error: "OMDb could not be reached." });
    }

    const result = await response.json();
    if (result.Response === "False") {
      return res.status(404).json({ error: result.Error ?? "Movie not found in OMDb." });
    }
    if (typeof result.Poster !== "string" || !/^https?:\/\//i.test(result.Poster)) {
      return res.status(404).json({ error: "OMDb has no poster for this movie." });
    }

    return res.status(200).json({ posterUrl: result.Poster, title: result.Title ?? "" });
  } catch {
    return res.status(502).json({ error: "Could not search OMDb for this poster." });
  }
}
