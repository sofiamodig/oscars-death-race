import { useEffect, useState } from "react";
import { MoviesYearsListType } from "@/types";

let catalogCache: MoviesYearsListType | undefined;
let catalogPromise: Promise<MoviesYearsListType> | undefined;

const loadMovieCatalog = () => {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (!catalogPromise) {
    catalogPromise = fetch("/movies.json")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the movie catalog.");
        return response.json() as Promise<MoviesYearsListType>;
      })
      .then((catalog) => {
        catalogCache = catalog;
        return catalog;
      })
      .catch((error) => {
        catalogPromise = undefined;
        throw error;
      });
  }
  return catalogPromise;
};

export const useMovieCatalog = () => {
  const [movies, setMovies] = useState<MoviesYearsListType | undefined>(catalogCache);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(!catalogCache);

  useEffect(() => {
    let active = true;
    loadMovieCatalog()
      .then((catalog) => {
        if (active) setMovies(catalog);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the movie catalog.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return { movies, error, loading };
};
