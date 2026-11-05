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
const crosswalkUrl = "https://crosswalk.titles.media/exports/movies/ids/movies.json";
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

// Identifier mappings come from titles.media crosswalk (ODC-BY 1.0).
async function loadCrosswalk() {
  const response = await fetch(crosswalkUrl, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const detail = (await response.text()).slice(0, 300);
    const retryMessage = retryAfter ? ` Retry-After: ${retryAfter}.` : " No Retry-After header was provided.";
    throw new Error(`Could not download the crosswalk (HTTP ${response.status}).${retryMessage}${detail ? ` ${detail}` : ""}`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("The crosswalk response was not a JSON array.");

  const byImdbId = new Map();
  for (const row of rows) {
    if (typeof row.imdb_id !== "string" || !row.imdb_id || typeof row.letterboxd_id !== "string" || !row.letterboxd_id) continue;
    byImdbId.set(row.imdb_id, row.letterboxd_id.trim().toLowerCase());
  }
  return byImdbId;
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
const toCheck = movies.filter((movie) => typeof movie.imdb_id === "string" && movie.imdb_id.trim());
console.log("Downloading the titles.media crosswalk once for local IMDb ID lookups...");
const crosswalkByImdbId = await loadCrosswalk();
const canonicalIds = new Map();
let failed = 0;
let unmapped = 0;
let checked = 0;

console.log(`Checking ${toCheck.length} movies against ${crosswalkByImdbId.size} crosswalk mappings. Mode: ${applyChanges ? "APPLY" : "DRY RUN"}.`);

async function processMovie(movie) {
  const currentId = typeof movie.letterboxd_id === "string" ? movie.letterboxd_id.trim().toLowerCase() : "";
  const label = `${movie.year} ${movie.title} (${movie.imdb_id})`;
  try {
    const canonicalId = crosswalkByImdbId.get(movie.imdb_id) ?? null;
    checked++;
    if (checked % 100 === 0) console.log(`Looked up ${checked}/${toCheck.length} movies.`);
    if (!canonicalId) {
      unmapped++;
      return;
    }
    const conflictingMovie = canonicalIds.get(canonicalId);
    if (conflictingMovie && conflictingMovie.imdb_id !== movie.imdb_id) {
      failed++;
      console.error(`SKIP ${label}: canonical ID ${canonicalId} is also assigned to ${conflictingMovie.title} (${conflictingMovie.imdb_id})`);
      return;
    }
    canonicalIds.set(canonicalId, movie);
    if (canonicalId === currentId) return;
    if (applyChanges) await updateLetterboxdId(movie, canonicalId);
    console.log(`${applyChanges ? "UPDATED" : "WOULD UPDATE"} ${label}: ${currentId || "(empty)"} -> ${canonicalId}`);
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
console.log(`${applyChanges ? "Updated" : "Would update"} IDs. Lookups completed: ${checked}; no mapping: ${unmapped}; failed or conflicting: ${failed}.`);
if (failed) process.exitCode = 1;
