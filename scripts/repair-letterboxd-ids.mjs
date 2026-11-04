#!/usr/bin/env node

import { readFile } from "node:fs/promises";

// Load .env.local without adding a runtime dependency. Existing shell variables win.
try {
  const envFile = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(\")(.*)\1$/, "$2").replace(/^(\')(.*)\1$/, "$2");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const supabaseUrl = process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Set NEXT_SUPABASE_URL and NEXT_SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const applyChanges = process.argv.includes("--apply");
const pageSize = 500;
const concurrency = 6;
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function loadMovies() {
  const movies = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL("/rest/v1/movies", supabaseUrl);
    url.search = new URLSearchParams({
      select: "year,imdb_id,title,letterboxd_id",
      order: "year.desc,title.asc",
      limit: String(pageSize),
      offset: String(offset),
    }).toString();
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Could not load movies (${response.status}): ${await response.text()}`);
    const page = await response.json();
    movies.push(...page);
    if (page.length < pageSize) return movies;
  }
}

async function resolveCanonicalSlug(letterboxdId) {
  const filmUrl = new URL(`/film/${encodeURIComponent(letterboxdId)}/`, "https://letterboxd.com");
  const response = await fetch(filmUrl, {
    redirect: "follow",
    headers: { "User-Agent": "OscarsDeathRace/0.1.0" },
    signal: AbortSignal.timeout(15000),
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`Letterboxd returned HTTP ${response.status}`);

  const finalUrl = new URL(response.url);
  if (!["letterboxd.com", "www.letterboxd.com"].includes(finalUrl.hostname)) {
    throw new Error(`Unexpected redirect host: ${finalUrl.hostname}`);
  }
  const slug = finalUrl.pathname.match(/^\/film\/([^/]+)\/?$/i)?.[1];
  if (!slug) throw new Error(`Redirect did not end at a film URL: ${finalUrl.href}`);
  return decodeURIComponent(slug).toLowerCase();
}

async function updateLetterboxdId(movie, letterboxdId) {
  const url = new URL("/rest/v1/movies", supabaseUrl);
  url.search = new URLSearchParams({ year: `eq.${movie.year}`, imdb_id: `eq.${movie.imdb_id}` }).toString();
  const response = await fetch(url, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ letterboxd_id: letterboxdId }),
  });
  if (!response.ok) throw new Error(`Supabase update failed (${response.status}): ${await response.text()}`);
}

const movies = await loadMovies();
const toCheck = movies.filter((movie) =>
  typeof movie.letterboxd_id === "string" && movie.letterboxd_id.trim().length > 0
);
const canonicalIds = new Map();
let failed = 0;

console.log(`Checking ${toCheck.length} stored Letterboxd IDs. Mode: ${applyChanges ? "APPLY" : "DRY RUN"}.`);

async function processMovie(movie) {
  if (typeof movie.letterboxd_id !== "string" || !movie.letterboxd_id.trim()) return;
  const currentId = movie.letterboxd_id.trim().toLowerCase();
  const label = `${movie.year} ${movie.title} (${movie.imdb_id})`;
  try {
    const canonicalId = await resolveCanonicalSlug(currentId);
    const conflictingMovie = canonicalIds.get(canonicalId);
    if (conflictingMovie && conflictingMovie.imdb_id !== movie.imdb_id) {
      failed++;
      console.error(`SKIP ${label}: canonical ID ${canonicalId} is also assigned to ${conflictingMovie.title} (${conflictingMovie.imdb_id})`);
      return;
    }
    canonicalIds.set(canonicalId, movie);
    if (canonicalId === currentId) return;
    if (applyChanges) await updateLetterboxdId(movie, canonicalId);
    console.log(`${applyChanges ? "UPDATED" : "WOULD UPDATE"} ${label}: ${currentId} -> ${canonicalId}`);
  } catch (error) {
    failed++;
    console.error(`FAILED ${label} (${currentId}): ${error instanceof Error ? error.message : error}`);
  }
}

// Finish checking each year before starting the previous year.
for (let start = 0; start < toCheck.length;) {
  const year = toCheck[start].year;
  let end = start + 1;
  while (end < toCheck.length && toCheck[end].year === year) end++;
  const yearMovies = toCheck.slice(start, end);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, yearMovies.length) }, async () => {
    while (nextIndex < yearMovies.length) await processMovie(yearMovies[nextIndex++]);
  }));
  start = end;
}
console.log(`${applyChanges ? "Updated" : "Would update"} IDs where Letterboxd redirected to a different film slug. Failed or conflicting: ${failed}.`);
if (failed) process.exitCode = 1;
