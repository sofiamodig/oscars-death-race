import { parseCsvRows, parseImdbRatingsCsv } from "@/server/imdbRatingsCsv";

export type WatchedImportSource = "imdb" | "letterboxd" | "simkl";
export type WatchedImportRow = { id: string; date: string; uri?: string };

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
};

const headersAndRows = (csv: string) => {
  const rows = parseCsvRows(csv);
  const headers = rows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim().toLowerCase()
  );
  return { headers, rows: rows.slice(1) };
};

export const parseWatchedImportCsv = (csv: string, source: WatchedImportSource) => {
  if (source === "imdb") {
    const parsed = parseImdbRatingsCsv(csv);
    return { rows: parsed.ratings.map(({ imdbId, date }) => ({ id: imdbId, date })), skipped: parsed.skipped };
  }

  const { headers, rows } = headersAndRows(csv);
  const dateIndex = headers.findIndex((header) =>
    source === "letterboxd"
      ? header === "date" || header === "watched date"
      : ["watcheddate", "watched date", "last watched", "last watched date", "date"].includes(header)
  );
  const idIndex = source === "letterboxd"
    ? headers.findIndex((header) => ["letterboxd uri", "letterboxd url", "uri"].includes(header))
    : headers.findIndex((header) => ["simkl id", "simkl_id", "simkl"].includes(header));
  const uriIndex = source === "letterboxd" ? idIndex : -1;
  const idsIndex = source === "simkl" ? headers.findIndex((header) => header === "ids") : -1;

  if (dateIndex < 0) {
    throw new Error(source === "letterboxd"
      ? 'The CSV must include a "Date" column.'
      : 'The CSV must include a Simkl "WatchedDate" (or "Last Watched") column.');
  }
  if (source === "letterboxd" && uriIndex < 0) {
    throw new Error('The CSV must include a "Letterboxd URI" column.');
  }
  if (source === "simkl" && idIndex < 0 && idsIndex < 0) {
    throw new Error('The CSV must include a "Simkl ID" or "IDs" column.');
  }

  const imported: WatchedImportRow[] = [];
  let skipped = 0;
  for (const values of rows) {
    const dateValue = values[dateIndex]?.trim() ?? "";
    const date = dateValue.slice(0, 10);
    let id = "";
    let uri: string | undefined;
    if (source === "letterboxd") {
      uri = values[uriIndex]?.trim();
      id = uri ?? "";
    } else {
      id = values[idIndex]?.trim() ?? "";
      if (!/^\d+$/.test(id) && idsIndex >= 0) {
        const ids = values[idsIndex] ?? "";
        id = ids.match(/(?:["']?simkl["']?\s*[:=]\s*["']?|simkl\/)(\d+)/i)?.[1] ?? "";
      }
      const typeIndex = headers.indexOf("type");
      if (typeIndex >= 0 && values[typeIndex]?.trim().toLowerCase() !== "movie") {
        skipped++;
        continue;
      }
      const statusIndex = headers.findIndex((header) => header === "watchlist" || header === "status");
      if (statusIndex >= 0 && !/^(completed|watched|seen)$/i.test(values[statusIndex]?.trim() ?? "")) {
        skipped++;
        continue;
      }
    }

    if (!id || !validDate(date)) {
      skipped++;
      continue;
    }
    imported.push({ id, date, ...(uri ? { uri } : {}) });
  }

  const byId = new Map<string, WatchedImportRow>();
  for (const item of imported) {
    const existing = byId.get(item.id);
    if (!existing || item.date > existing.date) byId.set(item.id, item);
  }
  return { rows: [...byId.values()], skipped: skipped + imported.length - byId.size };
};
