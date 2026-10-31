type ImdbRatingRow = { imdbId: string; date: string };

// IMDb exports use RFC 4180 style quoting; titles may contain commas and quotes.
export const parseImdbRatingsCsv = (csv: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && csv[index + 1] === "\n") index++;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV has no rating rows.");

  const headers = rows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, "") : header).trim()
  );
  const imdbIndex = headers.indexOf("Const");
  const dateIndex = headers.indexOf("Date Rated");
  if (imdbIndex < 0 || dateIndex < 0) {
    throw new Error('The CSV must include IMDb "Const" and "Date Rated" columns.');
  }

  const ratings: ImdbRatingRow[] = [];
  let skipped = 0;
  const ratingIndexes = new Map<string, number>();
  for (const values of rows.slice(1)) {
    const imdbId = values[imdbIndex]?.trim() ?? "";
    const date = values[dateIndex]?.trim() ?? "";
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
    if (
      !/^tt\d+$/.test(imdbId) ||
      !parsedDate ||
      Number.isNaN(parsedDate.valueOf()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      skipped++;
      continue;
    }
    // If the export contains duplicates, keep its latest rated date.
    const existingIndex = ratingIndexes.get(imdbId);
    if (existingIndex !== undefined) {
      const existing = ratings[existingIndex];
      if (date > existing.date) existing.date = date;
    } else {
      ratingIndexes.set(imdbId, ratings.length);
      ratings.push({ imdbId, date });
    }
  }
  return { ratings, skipped };
};
