import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, getAdminClient } from "@/server/supabaseAdmin";
import { parseLetterboxdWatchedCsv } from "@/server/letterboxdWatchedCsv";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

type CatalogMovie = {
  year: number;
  imdb_id: string;
  letterboxd_id: string | null;
};

const allowedHosts = ["letterboxd.com", "www.letterboxd.com", "boxd.it", "www.boxd.it"];

const slugFromUrl = (url: URL) => {
  if (!["letterboxd.com", "www.letterboxd.com"].includes(url.hostname)) return null;
  const match = url.pathname.match(/^\/film\/([^/]+)\/?$/i);
  return match ? decodeURIComponent(match[1]).toLowerCase() : null;
};

const resolveLetterboxdSlug = async (uri: string): Promise<string | null> => {
  let target: URL;
  try {
    target = new URL(uri);
  } catch {
    return null;
  }
  if (target.protocol !== "https:" || !allowedHosts.includes(target.hostname)) return null;

  const directSlug = slugFromUrl(target);
  if (directSlug) return directSlug;

  for (let redirects = 0; redirects < 5; redirects++) {
    try {
      const response = await fetch(target, {
        redirect: "manual",
        headers: { "User-Agent": "OscarsDeathRace/0.1.0" },
      });
      await response.body?.cancel();
      if (response.status < 300 || response.status >= 400) return slugFromUrl(target);

      const location = response.headers.get("location");
      if (!location) return null;
      target = new URL(location, target);
      if (target.protocol !== "https:" || !allowedHosts.includes(target.hostname)) return null;
      const slug = slugFromUrl(target);
      if (slug) return slug;
    } catch {
      return null;
    }
  }
  return null;
};

const resolveShortLinks = async (uris: string[]) => {
  const results = new Array<string | null>(uris.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(8, uris.length) }, async () => {
    while (nextIndex < uris.length) {
      const index = nextIndex++;
      results[index] = await resolveLetterboxdSlug(uris[index]);
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
  if (typeof req.body?.csv !== "string") {
    return res.status(400).json({ error: "Upload a Letterboxd watched.csv file." });
  }

  let parsed: ReturnType<typeof parseLetterboxdWatchedCsv>;
  try {
    parsed = parseLetterboxdWatchedCsv(req.body.csv);
  } catch (parseError) {
    return res.status(400).json({ error: parseError instanceof Error ? parseError.message : "Could not read the Letterboxd CSV." });
  }

  const shortLinkRows = parsed.rows.filter((row) => !row.slug);
  const resolvedShortSlugs = await resolveShortLinks(shortLinkRows.map((row) => row.uri));
  const resolvedByUri = new Map(shortLinkRows.map((row, index) => [row.uri, resolvedShortSlugs[index]]));
  const client = getAdminClient();
  const catalog = new Map<string, CatalogMovie>();

  for (let offset = 0; ; offset += 1000) {
    const { data, error: queryError } = await client
      .from("movies")
      .select("year, imdb_id, letterboxd_id")
      .order("year", { ascending: true })
      .order("imdb_id", { ascending: true })
      .range(offset, offset + 999);
    if (queryError) return res.status(500).json({ error: queryError.message });
    for (const movie of (data ?? []) as CatalogMovie[]) {
      if (movie.letterboxd_id) catalog.set(movie.letterboxd_id.toLowerCase(), movie);
    }
    if (!data || data.length < 1000) break;
  }

  const matchedByMovie = new Map<string, { user_id: string; year: number; imdb_id: string; seen_at: string }>();
  let matchedCount = 0;
  for (const row of parsed.rows) {
    const slug = row.slug ?? resolvedByUri.get(row.uri);
    const movie = slug ? catalog.get(slug) : undefined;
    if (!movie) continue;
    matchedCount++;
    const existing = matchedByMovie.get(movie.imdb_id);
    if (!existing || row.date > existing.seen_at.slice(0, 10)) {
      matchedByMovie.set(movie.imdb_id, {
        user_id: user.id,
        year: movie.year,
        imdb_id: movie.imdb_id,
        seen_at: `${row.date}T12:00:00.000Z`,
      });
    }
  }

  const matched = [...matchedByMovie.values()];
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
    unmatched: parsed.rows.length - matchedCount,
    skipped: parsed.skipped,
  });
}
