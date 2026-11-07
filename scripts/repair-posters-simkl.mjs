#!/usr/bin/env node

import { readFile } from "node:fs/promises";

// Load .env.local without adding a runtime dependency. Existing shell variables win.
try {
  const envFile = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^("|')(.*)\1$/, "$2");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const supabaseUrl = process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
const simklClientId = process.env.SIMKL_CLIENT_ID;
if (!supabaseUrl || !supabaseKey || !simklClientId) {
  console.error("Set NEXT_SUPABASE_URL, NEXT_SUPABASE_SERVICE_ROLE_KEY, and SIMKL_CLIENT_ID.");
  process.exit(1);
}

const applyChanges = process.argv.includes("--apply");
const pageSize = 500;
const concurrency = 3;
const simklAppName = "oscars-death-race";
const simklAppVersion = "0.1.0";
const simklUserAgent = `${simklAppName}/${simklAppVersion} (https://www.oscarsdeathrace.com)`;
const supabaseHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

function simklApiUrl(path) {
  const url = new URL(path, "https://api.simkl.com");
  url.searchParams.set("client_id", simklClientId);
  url.searchParams.set("app-name", simklAppName);
  url.searchParams.set("app-version", simklAppVersion);
  return url;
}

async function getMovies() {
  const movies = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL("/rest/v1/movies", supabaseUrl);
    url.search = new URLSearchParams({
      select: "year,imdb_id,simkl_id,title,poster_url",
      order: "year.desc,title.asc",
      limit: String(pageSize),
      offset: String(offset),
    }).toString();
    const response = await fetch(url, { headers: supabaseHeaders });
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
    return response.ok && (response.headers.get("content-type") ?? "").toLowerCase().startsWith("image/");
  } catch {
    return false;
  }
}

async function resolveSimklId(movie) {
  if (Number.isSafeInteger(movie.simkl_id) && movie.simkl_id > 0) return movie.simkl_id;
  if (typeof movie.imdb_id !== "string" || !/^tt\d+$/i.test(movie.imdb_id)) {
    throw new Error("Movie has no usable Simkl or IMDb ID");
  }

  const url = simklApiUrl("/redirect");
  url.searchParams.set("to", "simkl");
  url.searchParams.set("imdb", movie.imdb_id);
  const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": simklUserAgent }, signal: AbortSignal.timeout(15000) });
  if (!response.ok && (response.status < 300 || response.status >= 400)) {
    throw new Error(`Simkl ID lookup failed (HTTP ${response.status})`);
  }
  const location = response.headers.get("location");
  const simklUrl = location ? new URL(location, "https://simkl.com") : null;
  const match = simklUrl?.pathname.match(/^\/movies?\/(\d+)(?:\/|$)/i);
  const simklId = Number(match?.[1]);
  if (!Number.isSafeInteger(simklId) || simklId <= 0) throw new Error("Simkl could not resolve this IMDb ID");
  return simklId;
}

async function lookupPoster(movie) {
  const simklId = await resolveSimklId(movie);
  const response = await fetch(simklApiUrl(`/movies/${simklId}`), {
    headers: { "User-Agent": simklUserAgent },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Simkl movie lookup failed (HTTP ${response.status})`);
  const result = await response.json();
  const posterPath = result?.movie?.poster ?? result?.poster;
  if (typeof posterPath !== "string" || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(posterPath)) {
    throw new Error("Simkl has no poster for this movie");
  }

  const imageUrl = new URL("https://simkl.in/posters/" + posterPath + "_m.webp");
  const proxyUrl = new URL("https://wsrv.nl/");
  proxyUrl.searchParams.set("url", imageUrl.href);
  proxyUrl.searchParams.set("q", "90");
  return proxyUrl.toString();
}

async function updatePoster(movie, posterUrl) {
  const url = new URL("/rest/v1/movies", supabaseUrl);
  url.search = new URLSearchParams({ year: `eq.${movie.year}`, imdb_id: `eq.${movie.imdb_id}` }).toString();
  const response = await fetch(url, {
    method: "PATCH",
    headers: { ...supabaseHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
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
