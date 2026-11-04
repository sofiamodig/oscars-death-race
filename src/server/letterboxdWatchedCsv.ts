import { parseCsvRows } from "@/server/imdbRatingsCsv";

export type LetterboxdWatchedRow = {
  date: string;
  slug: string | null;
  uri: string;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

const getDirectFilmSlug = (uri: string) => {
  try {
    const url = new URL(uri);
    if (url.protocol !== "https:" || !["letterboxd.com", "www.letterboxd.com"].includes(url.hostname)) {
      return null;
    }
    const match = url.pathname.match(/^\/film\/([^/]+)\/?$/i);
    return match ? decodeURIComponent(match[1]).toLowerCase() : null;
  } catch {
    return null;
  }
};

export const parseLetterboxdWatchedCsv = (csv: string) => {
  const rows = parseCsvRows(csv);
  const headers = rows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim().toLowerCase()
  );
  const dateIndex = headers.findIndex((header) => ["date", "watched date"].includes(header));
  const uriIndex = headers.findIndex((header) =>
    ["letterboxd uri", "letterboxd url", "uri"].includes(header)
  );

  if (dateIndex < 0) throw new Error('The CSV must include a "Date" column.');
  if (uriIndex < 0) throw new Error('The CSV must include a "Letterboxd URI" column.');

  const allowedHosts = ["letterboxd.com", "www.letterboxd.com", "boxd.it", "www.boxd.it"];
  const byFilm = new Map<string, LetterboxdWatchedRow>();
  let skipped = 0;
  let validRows = 0;

  for (const values of rows.slice(1)) {
    const uri = values[uriIndex]?.trim() ?? "";
    const date = values[dateIndex]?.trim().slice(0, 10) ?? "";
    let url: URL | undefined;
    try {
      url = new URL(uri);
    } catch {
      // Count malformed URLs with the other skipped rows below.
    }

    if (!url || url.protocol !== "https:" || !allowedHosts.includes(url.hostname) || !isValidDate(date)) {
      skipped++;
      continue;
    }

    validRows++;
    const slug = getDirectFilmSlug(uri);
    const key = slug ?? uri.toLowerCase();
    const existing = byFilm.get(key);
    if (!existing || date > existing.date) byFilm.set(key, { date, slug, uri });
  }

  const result = Array.from(byFilm.values());
  return { rows: result, skipped: skipped + validRows - result.length };
};
