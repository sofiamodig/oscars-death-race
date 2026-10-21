import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, getAdminClient } from "@/server/supabaseAdmin";
import { parseWatchedImportCsv, type WatchedImportSource } from "@/server/watchedImportCsv";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

type CatalogMovie = {
  year: number;
  imdb_id: string;
  letterboxd_id: string | null;
  simkl_id: number | null;
};

const resolveLetterboxdSlug = async (uri: string): Promise<string | null> => {
  let input: URL;
  try {
    input = new URL(uri);
  } catch {
    return null;
  }
  const allowedHost = (hostname: string) =>
    ["boxd.it", "www.boxd.it", "letterboxd.com", "www.letterboxd.com"].includes(hostname);
  if (input.protocol !== "https:" || !allowedHost(input.hostname)) {
    return null;
  }

  try {
    let target = input;
    for (let redirects = 0; redirects <= 5; redirects++) {
      const response = await fetch(target, {
        redirect: "manual",
        headers: { "User-Agent": "OscarsDeathRace/0.1.0" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === 5) return null;
        target = new URL(location, target);
        if (target.protocol !== "https:" || !allowedHost(target.hostname)) return null;
        continue;
      }
      if (!response.ok || !["letterboxd.com", "www.letterboxd.com"].includes(target.hostname)) return null;
      const match = target.pathname.match(/^\/film\/([^/]+)\/?$/i);
      return match ? decodeURIComponent(match[1]).toLowerCase() : null;
    }
    return null;
  } catch {
    return null;
  }
};

const mapConcurrent = async <T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { user, error } = await authenticateRequest(req);
  if (!user) return res.status(401).json({ error });
  const source = req.body?.source as WatchedImportSource;
  if (!["imdb", "letterboxd", "simkl"].includes(source)) {
    return res.status(400).json({ error: "Choose IMDb, Letterboxd, or Simkl as the import source." });
  }
  if (typeof req.body?.csv !== "string") {
    return res.status(400).json({ error: "Upload a CSV file." });
  }

  let parsed: ReturnType<typeof parseWatchedImportCsv>;
  try {
    parsed = parseWatchedImportCsv(req.body.csv, source);
  } catch (parseError) {
    return res.status(400).json({ error: parseError instanceof Error ? parseError.message : "Could not read the CSV." });
  }

  let idsAndDates: { id: string; date: string }[];
  if (source === "letterboxd") {
    const resolved = await mapConcurrent(parsed.rows, 8, async (item) => ({
      id: await resolveLetterboxdSlug(item.uri ?? item.id),
      date: item.date,
    }));
    idsAndDates = resolved.flatMap((item) => item.id ? [{ id: item.id, date: item.date }] : []);
  } else {
    idsAndDates = parsed.rows.map(({ id, date }) => ({ id, date }));
  }

  const client = getAdminClient();
  const catalog = new Map<string, CatalogMovie>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error: queryError } = await client
      .from("movies")
      .select("year, imdb_id, letterboxd_id, simkl_id")
      .order("year", { ascending: true })
      .range(offset, offset + 999);
    if (queryError) return res.status(500).json({ error: queryError.message });
    for (const movie of (data ?? []) as CatalogMovie[]) {
      const key = source === "imdb" ? movie.imdb_id
        : source === "letterboxd" ? movie.letterboxd_id?.toLowerCase()
        : movie.simkl_id == null ? undefined : String(movie.simkl_id);
      if (key) catalog.set(key, movie);
    }
    if (!data || data.length < 1000) break;
  }

  const matchedByImdb = new Map<string, { user_id: string; year: number; imdb_id: string; seen_at: string }>();
  let matchedRows = 0;
  for (const item of idsAndDates) {
    const movie = catalog.get(item.id.toLowerCase());
    if (!movie) continue;
    matchedRows++;
    const existing = matchedByImdb.get(movie.imdb_id);
    if (!existing || item.date > existing.seen_at.slice(0, 10)) {
      matchedByImdb.set(movie.imdb_id, {
        user_id: user.id,
        year: movie.year,
        imdb_id: movie.imdb_id,
        seen_at: `${item.date}T12:00:00.000Z`,
      });
    }
  }
  const matched = [...matchedByImdb.values()];
  const alreadySeen = new Set<string>();
  for (let offset = 0; offset < matched.length; offset += 500) {
    const { data, error: seenError } = await client
      .from("seen_movies")
      .select("year, imdb_id")
      .eq("user_id", user.id)
      .in("imdb_id", matched.slice(offset, offset + 500).map((item) => item.imdb_id));
    if (seenError) return res.status(500).json({ error: seenError.message });
    for (const row of data ?? []) alreadySeen.add(`${row.year}:${row.imdb_id}`);
  }

  const newSeen = matched.filter((item) => !alreadySeen.has(`${item.year}:${item.imdb_id}`));
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
    unmatched: parsed.rows.length - matchedRows,
    skipped: parsed.skipped,
  });
}
