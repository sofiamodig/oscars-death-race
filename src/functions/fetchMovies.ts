import { db } from "@/firebaseConfig";
import { MovieType } from "@/types";
import { collection, getDocs } from "@firebase/firestore";

export const fetchMovies = async () => {
  const moviesCollectionRef = collection(db, "movie-collection");
  const moviesByYear: Record<string, MovieType[]> = {};

  const querySnapshot = await getDocs(moviesCollectionRef);
  for (const doc of querySnapshot.docs) {
    const year = doc.id;
    const movieDetailsRef = collection(db, "movie-collection", year, "movies");
    const movieDetailsSnapshot = await getDocs(movieDetailsRef);

    moviesByYear[year] = [];
    movieDetailsSnapshot.forEach((detailDoc) => {
      // @ts-ignore
      moviesByYear[year].push({
        id: detailDoc.id,
        ...detailDoc.data(),
      });
    });
  }

  const moviesArray = Object.keys(moviesByYear).map((year) => ({
    year: year,
    movies: moviesByYear[year].sort((a, b) => {
      if (!a.title || !b.title) return 0;
      return a.title.localeCompare(b.title);
    }),
  }));

  return moviesArray;
};
