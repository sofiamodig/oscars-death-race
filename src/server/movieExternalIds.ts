interface ExternalMovieIds {
  simklId: number | null;
  tmdbId: string | null;
  letterboxdId: string | null;
  warnings: string[];
}

const SIMKL_APP_NAME = "oscars-death-race";
const SIMKL_APP_VERSION = "0.1.0";

const simklApiUrl = (path: string, clientId: string) => {
  const url = new URL(path, "https://api.simkl.com");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("app-name", SIMKL_APP_NAME);
  url.searchParams.set("app-version", SIMKL_APP_VERSION);
  return url;
};

const simklUserAgent = `${SIMKL_APP_NAME}/${SIMKL_APP_VERSION} (https://www.oscarsdeathrace.com)`;

const resolveSimklMovie = async (imdbId: string, clientId: string) => {
  const url = simklApiUrl("/redirect", clientId);
  url.searchParams.set("to", "simkl");
  url.searchParams.set("imdb", imdbId);
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": simklUserAgent },
  });
  if (!response.ok && (response.status < 300 || response.status >= 400)) {
    throw new Error(`Simkl lookup failed (HTTP ${response.status}).`);
  }

  const location = response.headers.get("location");
  if (!location) return null;

  const movieUrl = new URL(location, "https://simkl.com");
  const match = movieUrl.pathname.match(/^\/movies?\/(\d+)(?:\/|$)/i);
  const simklId = Number(match?.[1]);
  if (!Number.isSafeInteger(simklId) || simklId <= 0) return null;
  return simklId;
};

const fetchSimklMovieById = async (simklId: number, clientId: string) => {
  const url = simklApiUrl(`/movies/${simklId}`, clientId);
  const response = await fetch(url, {
    // Simkl's movie summaries are cached catalog data; omit Authorization so
    // these requests remain eligible for its shared Cloudflare cache.
    headers: { "User-Agent": simklUserAgent },
  });
  if (!response.ok) return null;
  const result = await response.json();
  return result?.movie ?? result;
};

export const fetchSimklMovie = async (imdbId: string): Promise<ExternalMovieIds> => {
  const clientId = process.env.SIMKL_CLIENT_ID;
  if (!clientId) {
    return {
      simklId: null,
      tmdbId: null,
      letterboxdId: null,
      warnings: ["SIMKL_CLIENT_ID is not configured."],
    };
  }

  try {
    const simklId = await resolveSimklMovie(imdbId, clientId);
    if (!simklId) {
      return {
        simklId: null,
        tmdbId: null,
        letterboxdId: null,
        warnings: ["Simkl did not find a movie for this IMDb ID."],
      };
    }

    // Simkl recommends resolving external IDs through /redirect, then reading
    // the cached catalog record. Neither request needs a user access token.
    const apiMovie = await fetchSimklMovieById(simklId, clientId);
    return {
      simklId,
      tmdbId: apiMovie?.ids?.tmdb != null ? String(apiMovie.ids.tmdb) : null,
      letterboxdId: typeof apiMovie?.ids?.letterboxd === "string"
        ? apiMovie.ids.letterboxd
        : null,
      warnings: [],
    };
  } catch (error) {
    return {
      simklId: null,
      tmdbId: null,
      letterboxdId: null,
      warnings: [error instanceof Error ? error.message : "Simkl lookup failed."],
    };
  }
};
