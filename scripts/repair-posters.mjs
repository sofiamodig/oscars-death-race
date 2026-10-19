#!/usr/bin/env node

import { readFile } from "node:fs/promises";

// Load .env.local without adding a runtime dependency. Existing shell variables win.
try {
  const envFile = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const supabaseUrl = process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
const omdbKey = process.env.OMDB_API_KEY ?? process.env.NEXT_PUBLIC_OMDB_API_KEY;
if (!supabaseUrl || !supabaseKey || !omdbKey) {
  console.error("Set NEXT_SUPABASE_URL, NEXT_SUPABASE_SERVICE_ROLE_KEY, and OMDB_API_KEY (or NEXT_PUBLIC_OMDB_API_KEY).");
  process.exit(1);
}

const applyChanges = process.argv.includes("--apply");
const pageSize = 500;
const concurrency = 3;
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function getMovies() {
  const movies = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL("/rest/v1/movies", supabaseUrl);
    url.search = new URLSearchParams({
      select: "year,imdb_id,title,poster_url",
      order: "year.asc,title.asc",
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

async function posterIsValid(value) {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url || url.toLowerCase() === "n/a") return false;
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(12000) });
    const contentType = response.headers.get("content-type") ?? "";
    return response.ok && contentType.toLowerCase().startsWith("image/");
  } catch {
    return false;
  }
}

async function lookupPoster(movie) {
  const url = new URL("https://www.omdbapi.com/");
  url.search = new URLSearchParams({ i: movie.imdb_id, apikey: omdbKey }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`OMDb HTTP ${response.status}`);
  const result = await response.json();
  if (result.Response === "False") throw new Error(result.Error ?? "OMDb did not find this movie");
  if (typeof result.Poster !== "string" || !/^https?:\/\//i.test(result.Poster) || result.Poster.toLowerCase() === "n/a") {
    throw new Error("OMDb has no poster");
  }
  return result.Poster;
}

async function updatePoster(movie, posterUrl) {
  const url = new URL("/rest/v1/movies", supabaseUrl);
  url.search = new URLSearchParams({ year: `eq.${movie.year}`, imdb_id: `eq.${movie.imdb_id}` }).toString();
  const response = await fetch(url, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ poster_url: posterUrl }),
  });
  if (!response.ok) throw new Error(`Supabase update failed (${response.status}): ${await response.text()}`);
}

const movies = await getMovies();
let nextIndex = 0;
let repaired = 0;
let failed = 0;
console.log(`Checked ${movies.length} movies. Mode: ${applyChanges ? "APPLY" : "DRY RUN"}.`);

async function worker() {
  while (nextIndex < movies.length) {
    const movie = movies[nextIndex++];
    if (await posterIsValid(movie.poster_url)) continue;
    const label = `${movie.year} ${movie.title} (${movie.imdb_id})`;
    try {
      const posterUrl = await lookupPoster(movie);
      if (applyChanges) await updatePoster(movie, posterUrl);
      repaired++;
      console.log(`${applyChanges ? "UPDATED" : "WOULD UPDATE"} ${label}: ${posterUrl}`);
    } catch (error) {
      failed++;
      console.error(`FAILED ${label}: ${error instanceof Error ? error.message : error}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
console.log(`${applyChanges ? "Updated" : "Would update"} ${repaired}; failed ${failed}.`);
if (failed) process.exitCode = 1;
