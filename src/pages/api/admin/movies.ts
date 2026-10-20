import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAdmin, getAdminClient } from "@/server/supabaseAdmin";
import { fetchSimklMovie } from "@/server/movieExternalIds";

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, error } = await authenticateAdmin(req);
  if (!user) return res.status(403).json({ error });

  const body = req.body ?? {};
  const year = Number(body.year);
  const imdbId = String(body.imdbId ?? "").trim();
  if (!Number.isInteger(year) || !imdbId) {
    return res.status(400).json({ error: "A valid year and IMDb ID are required." });
  }
  const client = getAdminClient();

  if (req.method === "POST") {
    const title = String(body.title ?? "").trim();
    if (!title) return res.status(400).json({ error: "A title is required." });
    const duration = body.duration == null || body.duration === "" ? null : Number(body.duration);
    const { data: existingMovie, error: existingMovieError } = await client
      .from("movies")
      .select("tmdb_id, letterboxd_id, simkl_id")
      .eq("year", year)
      .eq("imdb_id", imdbId)
      .maybeSingle();
    if (existingMovieError) return res.status(500).json({ error: existingMovieError.message });

    const providedSimklId = String(body.simklId ?? "").trim();
    if (providedSimklId && (!/^\d+$/.test(providedSimklId) || Number(providedSimklId) <= 0)) {
      return res.status(400).json({ error: "Simkl ID must be a positive integer." });
    }
    const hasManualIds = Boolean(providedSimklId && body.tmdbId && body.letterboxdId);
    const simklResult = hasManualIds
      ? { simklId: Number(providedSimklId), tmdbId: null, letterboxdId: null, warnings: [] as string[] }
      : await fetchSimklMovie(imdbId);
    const simklId = Number.isSafeInteger(simklResult.simklId) && Number(simklResult.simklId) > 0
      ? Number(simklResult.simklId)
      : existingMovie?.simkl_id ?? null;
    const finalSimklId = providedSimklId ? Number(providedSimklId) : simklId;
    const finalTmdbId = String(body.tmdbId ?? "").trim() || simklResult.tmdbId || existingMovie?.tmdb_id || null;
    const finalLetterboxdId = String(body.letterboxdId ?? "").trim() || simklResult.letterboxdId || existingMovie?.letterboxd_id || null;
    const warnings = simklResult.warnings;
    const { error: writeError } = await client.from("movies").upsert(
      {
        year,
        imdb_id: imdbId,
        tmdb_id: finalTmdbId,
        letterboxd_id: finalLetterboxdId,
        simkl_id: finalSimklId,
        title,
        director: body.director || null,
        cast_members: typeof body.cast === "string" ? body.cast.split(", ").filter(Boolean) : asStringArray(body.cast),
        duration: Number.isFinite(duration) ? duration : null,
        poster_url: body.posterUrl || null,
        categories: asStringArray(body.categories),
        won_categories: asStringArray(body.wonCategories),
      },
      { onConflict: "year,imdb_id" }
    );
    if (writeError) return res.status(500).json({ error: writeError.message });
    return res.status(200).json({ success: true, tmdbId: finalTmdbId, letterboxdId: finalLetterboxdId, simklId: finalSimklId, warnings });
  }

  if (req.method === "PATCH") {
    const updates: Record<string, unknown> = {};
    if (Object.prototype.hasOwnProperty.call(body, "posterUrl")) updates.poster_url = body.posterUrl || null;
    if (Object.prototype.hasOwnProperty.call(body, "categories")) updates.categories = asStringArray(body.categories);
    if (Object.prototype.hasOwnProperty.call(body, "wonCategories")) {
      updates.won_categories = asStringArray(body.wonCategories);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "At least one movie field must be provided." });
    }
    const { error: writeError } = await client
      .from("movies")
      .update(updates)
      .eq("year", year)
      .eq("imdb_id", imdbId);
    if (writeError) return res.status(500).json({ error: writeError.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    const { error: writeError } = await client
      .from("movies")
      .delete()
      .eq("year", year)
      .eq("imdb_id", imdbId);
    if (writeError) return res.status(500).json({ error: writeError.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", "POST, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed." });
}
