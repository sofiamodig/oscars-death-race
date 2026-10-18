import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, getAdminClient } from "@/server/supabaseAdmin";
import { parseImdbRatingsCsv } from "@/server/imdbRatingsCsv";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { user, error } = await authenticateRequest(req);
  if (!user) return res.status(401).json({ error });
  if (typeof req.body?.csv !== "string") {
    return res.status(400).json({ error: "Upload an IMDb ratings CSV file." });
  }

  let parsed: ReturnType<typeof parseImdbRatingsCsv>;
  try {
    parsed = parseImdbRatingsCsv(req.body.csv);
  } catch (parseError) {
    return res.status(400).json({ error: parseError instanceof Error ? parseError.message : "Could not read the CSV." });
  }

  const client = getAdminClient();
  const catalog = new Map<string, number>();
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error: queryError } = await client
      .from("movies")
      .select("year, imdb_id")
      .order("year", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (queryError) return res.status(500).json({ error: queryError.message });
    for (const movie of data ?? []) catalog.set(movie.imdb_id, movie.year);
    if (!data || data.length < pageSize) break;
  }

  const matched = parsed.ratings.flatMap(({ imdbId, date }) => {
    const year = catalog.get(imdbId);
    return year === undefined
      ? []
      : [{ user_id: user.id, year, imdb_id: imdbId, seen_at: `${date}T12:00:00.000Z` }];
  });

  const alreadySeen = new Set<string>();
  const matchedIds = matched.map((movie) => movie.imdb_id);
  for (let offset = 0; offset < matchedIds.length; offset += 500) {
    const { data, error: seenError } = await client
      .from("seen_movies")
      .select("year, imdb_id")
      .eq("user_id", user.id)
      .in("imdb_id", matchedIds.slice(offset, offset + 500));
    if (seenError) return res.status(500).json({ error: seenError.message });
    for (const row of data ?? []) alreadySeen.add(`${row.year}:${row.imdb_id}`);
  }

  const newSeenMovies = matched.filter(
    (movie) => !alreadySeen.has(`${movie.year}:${movie.imdb_id}`)
  );
  for (let offset = 0; offset < newSeenMovies.length; offset += 500) {
    const { error: writeError } = await client.from("seen_movies").upsert(
      newSeenMovies.slice(offset, offset + 500),
      { onConflict: "user_id,year,imdb_id", ignoreDuplicates: true }
    );
    if (writeError) return res.status(500).json({ error: writeError.message });
  }

  return res.status(200).json({
    imported: newSeenMovies.length,
    alreadySeen: alreadySeen.size,
    unmatched: parsed.ratings.length - matched.length,
    skipped: parsed.skipped,
  });
}
