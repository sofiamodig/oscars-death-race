import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, getAdminClient } from "@/server/supabaseAdmin";
import { parseSimklBackupCsv } from "@/server/simklBackupCsv";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { user, error } = await authenticateRequest(req);
  if (!user) return res.status(401).json({ error });
  if (typeof req.body?.csv !== "string") {
    return res.status(400).json({ error: "Upload a Simkl backup CSV file." });
  }

  let parsed: ReturnType<typeof parseSimklBackupCsv>;
  try {
    parsed = parseSimklBackupCsv(req.body.csv);
  } catch (parseError) {
    return res.status(400).json({ error: parseError instanceof Error ? parseError.message : "Could not read the Simkl CSV." });
  }

  const client = getAdminClient();
  const catalog = new Map<string, number>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error: queryError } = await client
      .from("movies")
      .select("year, imdb_id")
      .order("year", { ascending: true })
      .range(offset, offset + 999);
    if (queryError) return res.status(500).json({ error: queryError.message });
    for (const movie of data ?? []) catalog.set(movie.imdb_id, movie.year);
    if (!data || data.length < 1000) break;
  }

  const matched = parsed.rows.flatMap(({ imdbId, date }) => {
    const year = catalog.get(imdbId);
    return year === undefined ? [] : [{ user_id: user.id, year, imdb_id: imdbId, seen_at: `${date}T12:00:00.000Z` }];
  });
  const alreadySeen = new Set<string>();
  for (let offset = 0; offset < matched.length; offset += 500) {
    const { data, error: seenError } = await client
      .from("seen_movies")
      .select("year, imdb_id")
      .eq("user_id", user.id)
      .in("imdb_id", matched.slice(offset, offset + 500).map((movie) => movie.imdb_id));
    if (seenError) return res.status(500).json({ error: seenError.message });
    for (const row of data ?? []) alreadySeen.add(`${row.year}:${row.imdb_id}`);
  }

  const newSeen = matched.filter((movie) => !alreadySeen.has(`${movie.year}:${movie.imdb_id}`));
  for (let offset = 0; offset < newSeen.length; offset += 500) {
    const { error: writeError } = await client.from("seen_movies").upsert(
      newSeen.slice(offset, offset + 500),
      { onConflict: "user_id,year,imdb_id", ignoreDuplicates: true }
    );
    if (writeError) return res.status(500).json({ error: writeError.message });
  }

  return res.status(200).json({
    imported: newSeen.length,
    alreadySeen: alreadySeen.size,
    unmatched: parsed.rows.length - matched.length,
    skipped: parsed.skipped,
  });
}
