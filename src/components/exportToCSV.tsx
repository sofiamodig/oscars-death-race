import { MoviesYearsListType, SeenMoviesType } from "@/types";
import { saveAs } from "file-saver";

const convertToCSV = (data: any[]) => {
  const header = Object.keys(data[0]).join(",") + "\n";
  const rows = data
    .map((row) =>
      Object.values(row)
        .map((value) =>
          typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
        )
        .join(",")
    )
    .join("\n");

  return header + rows;
};

const exportToCsv = (
  seenMoviesData: SeenMoviesType[],
  moviesList: MoviesYearsListType,
  fileName: string
) => {
  const data: any[] = [];

  seenMoviesData.forEach((seenYear) => {
    seenYear.seenMovies.forEach((seenMovie) => {
      const movie = moviesList
        .find((yearData) => yearData.year === seenYear.year)
        ?.movies.find((movie) => movie.imdbId === seenMovie.imdbId);

      if (movie) {
        data.push({
          Year: seenYear.year,
          "Movie Title": movie.title,
          "IMDB ID": movie.imdbId,
        });
      }
    });
  });

  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${fileName}.csv`);
};

export default exportToCsv;
