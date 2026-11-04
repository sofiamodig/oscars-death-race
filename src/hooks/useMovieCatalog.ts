import { useEffect, useState } from "react";
import { MoviesYearsListType } from "@/types";

export const useMovieCatalog = () => {
  const [movies, setMovies] = useState<MoviesYearsListType>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    fetch("/movies.json")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the movie catalog.");
        return response.json() as Promise<MoviesYearsListType>;
      })
      .then((catalog) => {
        if (active) setMovies(catalog);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the movie catalog.");
        }
      });

    return () => { active = false; };
  }, []);

  return { movies, error };
};
