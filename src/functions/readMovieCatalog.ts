import { readFile } from "node:fs/promises";
import path from "node:path";
import { MoviesYearsListType } from "@/types";

export const readMovieCatalog = async (): Promise<MoviesYearsListType> => {
  const filePath = path.join(process.cwd(), "public", "movies.json");
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as MoviesYearsListType;
};
