import { parseCsvRows } from "@/server/imdbRatingsCsv";

export type SimklWatchedRow = { imdbId: string; date: string };

export const parseSimklBackupCsv = (csv: string) => {
  const rows = parseCsvRows(csv);
  const headers = rows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim().toLowerCase()
  );
  const imdbIndex = headers.indexOf("imdb");
  const dateIndex = headers.indexOf("watcheddate");
  const statusIndex = headers.indexOf("watchlist");
  if (imdbIndex < 0 || dateIndex < 0) {
    throw new Error('The CSV must include "IMDB" and "WatchedDate" columns.');
  }

  const watched = new Map<string, string>();
  let skipped = 0;
  let validRows = 0;
  for (const values of rows.slice(1)) {
    const imdbId = values[imdbIndex]?.trim() ?? "";
    const rawDate = values[dateIndex]?.trim() ?? "";
    const dateMatch = rawDate.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+\d{2}:\d{2}:\d{2})?$/);
    const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : "";
    const parsedDate = date ? new Date(`${date}T00:00:00Z`) : null;
    const status = statusIndex < 0 ? "completed" : (values[statusIndex] ?? "").trim().toLowerCase();
    if (
      !/^tt\d+$/.test(imdbId) ||
      !dateMatch ||
      !parsedDate ||
      Number.isNaN(parsedDate.valueOf()) ||
      parsedDate.toISOString().slice(0, 10) !== date ||
      (status && status !== "completed")
    ) {
      skipped++;
      continue;
    }
    validRows++;
    const existing = watched.get(imdbId);
    if (!existing || date > existing) watched.set(imdbId, date);
  }

  return {
    rows: Array.from(watched, ([imdbId, date]) => ({ imdbId, date })),
    skipped: skipped + validRows - watched.size,
  };
};
