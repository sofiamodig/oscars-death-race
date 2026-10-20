import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAdmin } from "@/server/supabaseAdmin";
import { fetchSimklMovie } from "@/server/movieExternalIds";

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

  const movie = await fetchSimklMovie(imdbId);
  return res.status(200).json(movie);
}
