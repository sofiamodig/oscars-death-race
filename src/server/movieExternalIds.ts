interface ExternalMovieIds {
  tmdbId: string | null;
  simklId: number | null;
  warnings: string[];
}

const findTmdbId = async (imdbId: string, apiKey: string) => {
  const url = new URL(`https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}`);
  url.searchParams.set("external_source", "imdb_id");
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url);
  if (!response.ok) throw new Error("TMDb lookup failed.");
  const result = await response.json();
  const id = result.movie_results?.[0]?.id;
  return Number.isInteger(id) && id > 0 ? String(id) : null;
};

const findSimklId = async (imdbId: string, clientId: string) => {
  const url = new URL("https://api.simkl.com/redirect");
  url.searchParams.set("to", "simkl");
  url.searchParams.set("imdb", imdbId);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("app-name", "oscars-death-race");
  url.searchParams.set("app-version", "1.0");

  const response = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": "oscars-death-race/1.0" },
  });
  if (!response.ok && (response.status < 300 || response.status >= 400)) {
    throw new Error("Simkl lookup failed.");
  }

  const location = response.headers.get("location");
  if (!location) return null;
  const destination = new URL(location, "https://simkl.com");
  const match = destination.pathname.match(/^\/(?:movie|movies)\/(\d+)(?:\/|$)/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const fetchMovieExternalIds = async (imdbId: string): Promise<ExternalMovieIds> => {
  const warnings: string[] = [];
  const tmdbApiKey = process.env.TMDB_API_KEY;
  const simklClientId = process.env.SIMKL_CLIENT_ID;
  let tmdbId: string | null = null;
  let simklId: number | null = null;

  if (!tmdbApiKey) {
    warnings.push("TMDB_API_KEY is not configured.");
  } else {
    try {
      tmdbId = await findTmdbId(imdbId, tmdbApiKey);
      if (!tmdbId) warnings.push("TMDb has no match for this IMDb ID.");
    } catch {
      warnings.push("TMDb lookup failed.");
    }
  }

  if (!simklClientId) {
    warnings.push("SIMKL_CLIENT_ID is not configured, so no SIMKL ID was looked up.");
  } else {
    try {
      simklId = await findSimklId(imdbId, simklClientId);
      if (simklId === null) warnings.push("Simkl has no match for this IMDb ID.");
    } catch {
      warnings.push("Simkl lookup failed.");
    }
  }

  return { tmdbId, simklId, warnings };
};
