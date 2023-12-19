import { db } from "@/firebaseConfig";
import { MoviesYearsListType, SeenMoviesType, SeenType } from "@/types";
import { checkLatestYear } from "@/utils";
import {
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "@firebase/firestore";
import { DateTime } from "luxon";

interface Props {
  imdbId: string;
  userId: string;
  year: string;
  movies: MoviesYearsListType;
  seenMovies: SeenMoviesType[];
  predictions: boolean;
}

export const addMovieToSeenFunc = async ({
  imdbId,
  userId,
  year,
  movies,
  seenMovies,
  predictions,
}: Props) => {
  const docRef = doc(db, "users", userId);
  const currentDate = DateTime.now().toUTC().toISO();
  const movieYearObj = movies.find((movie) => movie.year === year);
  const moviesList = movieYearObj ? movieYearObj.movies : [];
  const seenMoviesList =
    seenMovies.find((list) => list.year === year)?.seenMovies ?? [];

  const filteredSeenMovies = seenMoviesList.filter((movie) => {
    return moviesList.some((yearMovie) => yearMovie.imdbId === movie.imdbId);
  });

  const isLatestYear = checkLatestYear(year, movies);

  const isCompletedRace =
    (isLatestYear &&
      !predictions &&
      moviesList?.length === filteredSeenMovies?.length + 1) ||
    (!isLatestYear && moviesList?.length === filteredSeenMovies?.length + 1);

  const movieObj: SeenType = {
    imdbId,
    date: currentDate,
  };

  const currentYearEntry = seenMovies.find((entry) => entry.year === year);

  const newSeenMovies = [];
  if (currentYearEntry) {
    // If the entry exists, add the new movie to its seenMovies array
    newSeenMovies.push(
      ...seenMovies.map((entry) =>
        entry.year === year
          ? {
              ...entry,
              seenMovies: [...entry?.seenMovies, movieObj],
              completed: isCompletedRace ? currentDate : null,
            }
          : entry
      )
    );
  } else {
    // If the entry doesn't exist, create a new one for the current year
    newSeenMovies.push(...seenMovies, {
      year: year,
      seenMovies: [movieObj],
      completed: isCompletedRace ? currentDate : null,
    });
  }

  getDoc(docRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        // Check if the year exists in the document
        if (docSnap.data()[year]) {
          // Year exists, update the list
          return updateDoc(docRef, {
            [`${year}.seenMovies`]: arrayUnion(movieObj),
            [`${year}.completed`]: isCompletedRace ? currentDate : null,
          });
        } else {
          // Year does not exist, create it
          return setDoc(
            docRef,
            {
              [year]: {
                seenMovies: [movieObj],
                completed: isCompletedRace ? currentDate : null,
              },
            },
            { merge: true }
          );
        }
      } else {
        throw new Error("An error occurred");
      }
    })
    .catch(() => {
      throw new Error("An error occurred");
    });

  return newSeenMovies;
};
