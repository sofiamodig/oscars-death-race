import { db } from "@/firebaseConfig";
import { MovieType, MoviesYearsListType, SeenType } from "@/types";
import { collection, getDocs } from "@firebase/firestore";

export type LeaderboardUser = {
  username: string;
  seen: number;
  percentage: number;
  completed: string | null;
};

export interface LeaderboardType {
  [year: string]: LeaderboardUser[];
}

export const fetchUsers = async (movies: MoviesYearsListType) => {
  const usersRef = collection(db, "users");

  const querySnapshot = await getDocs(usersRef);

  const usersArray: LeaderboardType = {};

  querySnapshot.forEach((doc) => {
    const userData = doc.data();
    const username = userData.username || null;
    const showInLeaderboard =
      userData.showInLeaderboard == false ? false : true;

    const obj = doc.data();

    for (const key in obj) {
      const year = parseInt(key, 10);

      if (!isNaN(year) && year >= 1990) {
        const yearString = year.toString();
        if (!usersArray[yearString]) {
          usersArray[yearString] = [] as LeaderboardUser[];
        }

        const seenMovies = obj[key]?.seenMovies || [];

        if (!seenMovies.length) {
          continue;
        }

        if (showInLeaderboard === false) {
          continue;
        }

        const yearMovies = movies?.find((movie) => movie.year === key)?.movies;

        if (!yearMovies) {
          continue;
        }

        const filteredSeenMovies = seenMovies.filter((movie: SeenType) => {
          return yearMovies.some(
            (yearMovie) => yearMovie.imdbId === movie.imdbId
          );
        });

        usersArray[year].push({
          username,
          seen: filteredSeenMovies.length,
          percentage: Math.round(
            (filteredSeenMovies.length / yearMovies?.length) * 100
          ),
          completed: userData[key]?.completed ?? null,
        });
      }
    }
  });

  return usersArray;
};
