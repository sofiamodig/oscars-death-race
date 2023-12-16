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
  seenMovies: SeenMoviesType[];
}

export const removeMovieFromSeenFunc = async ({
  imdbId,
  userId,
  year,
  seenMovies,
}: Props) => {
  const newSeenMovies = seenMovies.map((entry) => ({
    ...entry,
    seenMovies: entry.seenMovies?.filter((movie) => movie.imdbId !== imdbId),
    completed: null, // Reset completed date when removing a movie
  }));

  const docRef = doc(db, "users", userId);

  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const yearData = docSnap.data()[year];

      if (yearData) {
        const updatedSeenMovies = yearData.seenMovies?.filter(
          (movie: { imdbId: string }) => movie.imdbId !== imdbId
        );

        // Update the document in Firestore
        updateDoc(docRef, {
          [`${year}.seenMovies`]: updatedSeenMovies,
          completed: null, // Reset completed date in the document
        });
      }
    } else {
      throw new Error("An error occurred");
    }
  } catch (error) {
    throw new Error("An error occurred");
  }

  return newSeenMovies;
};
