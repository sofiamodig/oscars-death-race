import { UsersType } from "@/pages/statistics";
import { MovieType, MoviesYearsListType } from "@/types";
import { BLOCKED_USERS, minutesToHours } from "@/utils";

type WonCategoriesType = {
  maxCategories: number;
  movies: string[];
};

export const getRaceLength = (yearMovies: MovieType[]) => {
  const totalMinutes = yearMovies.reduce((acc, movie) => {
    if (movie.duration) {
      return acc + movie.duration;
    }
    return acc;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours < 40) {
    return "No data";
  }
  return `${hours}h ${remainingMinutes}min`;
};

export const getLongestMovie = (yearMovies: MovieType[]) => {
  const longestMovie = yearMovies.reduce(
    (acc, movie) => {
      if (movie.duration && movie.duration > acc.duration) {
        acc.duration = movie.duration;
        acc.title = movie.title;
      }
      return acc;
    },
    { duration: 0, title: "" }
  );

  if (longestMovie.duration === 0) {
    return "No data";
  }

  return `${longestMovie.title} (${minutesToHours(longestMovie.duration)})`;
};

export const getMostWins = (yearMovies: MovieType[]) => {
  const result = yearMovies.reduce(
    (acc: WonCategoriesType, movie) => {
      const categoryCount = movie.wonCategories?.length ?? 0;
      if (categoryCount > acc.maxCategories) {
        acc.maxCategories = categoryCount;
        acc.movies = [movie.title];
      } else if (categoryCount === acc.maxCategories) {
        acc.movies.push(movie.title);
      }
      return acc;
    },
    { maxCategories: 0, movies: [] }
  );

  if (result.maxCategories == 0) {
    return "No data";
  }

  return result.movies
    .map((title) => `${title} (${result.maxCategories})`)
    .join(", ");
};

export const getMostNominations = (yearMovies: MovieType[]) => {
  const result = yearMovies.reduce(
    (acc: WonCategoriesType, movie) => {
      const categoryCount = movie.categories?.length ?? 0;
      if (categoryCount > acc.maxCategories) {
        acc.maxCategories = categoryCount;
        acc.movies = [movie.title];
      } else if (categoryCount === acc.maxCategories) {
        acc.movies.push(movie.title);
      }
      return acc;
    },
    { maxCategories: 0, movies: [] }
  );

  return result.movies
    .map((title) => `${title} (${result.maxCategories})`)
    .join(", ");
};

export const getBestPictureWinner = (yearMovies: MovieType[]) => {
  const bestPictureWinner = yearMovies.find((movie) => {
    return movie.wonCategories?.some((category) => {
      return category === "Best Picture";
    });
  });

  if (!yearMovies.length) {
    return "No data";
  }

  return bestPictureWinner?.title ?? "Waiting for the Oscars";
};

export const getLongestRace = (movies: MoviesYearsListType) => {
  const longestRace = movies.reduce(
    (acc, year) => {
      const totalMinutes = year.movies.reduce((acc, movie) => {
        if (movie.duration) {
          return acc + movie.duration;
        }
        return acc;
      }, 0);

      if (totalMinutes > acc.duration) {
        acc.duration = totalMinutes;
        acc.year = year.year;
      }
      return acc;
    },
    { duration: 0, year: "" }
  );

  return `${longestRace.year} (${minutesToHours(longestRace.duration)})`;
};

export const getLongestMovieAllTime = (movies: MoviesYearsListType) => {
  const longestMovie = movies.reduce(
    (acc, year) => {
      const movie = year.movies.reduce(
        (acc, movie) => {
          if (movie.duration && movie.duration > acc.duration) {
            acc.duration = movie.duration;
            acc.title = movie.title;
          }
          return acc;
        },
        { duration: 0, title: "", year: "" }
      );

      if (movie.duration > acc.duration) {
        acc.duration = movie.duration;
        acc.title = movie.title;
        acc.year = year.year;
      }

      return acc;
    },
    { duration: 0, title: "", year: "" }
  );

  return `${longestMovie.title}, ${longestMovie.year} - (${minutesToHours(
    longestMovie.duration
  )})`;
};

export const getShortestMovieAllTime = (movies: MoviesYearsListType) => {
  const shortestMovie = movies.reduce(
    (acc, year) => {
      const movie = year.movies.reduce(
        (acc, movie) => {
          if (movie.duration && movie.duration < acc.duration) {
            acc.duration = movie.duration;
            acc.title = movie.title;
          }
          return acc;
        },
        { duration: Infinity, title: "", year: "" }
      );

      if (movie.duration < acc.duration) {
        acc.duration = movie.duration;
        acc.title = movie.title;
        acc.year = year.year;
      }

      return acc;
    },
    { duration: Infinity, title: "", year: "" }
  );

  return `${shortestMovie.title}, ${shortestMovie.year} - (${minutesToHours(
    shortestMovie.duration
  )})`;
};

export const getMostWinsAllTime = (movies: MoviesYearsListType) => {
  const result = movies.reduce(
    (
      acc: {
        nrOfWins: number;
        movies: string[];
      },
      year
    ) => {
      const yearResult = year.movies.reduce(
        (acc: WonCategoriesType, movie) => {
          const categoryCount = movie.wonCategories?.length ?? 0;
          if (categoryCount > acc.maxCategories) {
            acc.maxCategories = categoryCount;
            acc.movies = [movie.title];
          } else if (categoryCount === acc.maxCategories) {
            acc.movies.push(movie.title);
          }
          return acc;
        },
        { maxCategories: 0, movies: [] }
      );

      if (yearResult.maxCategories > acc.nrOfWins) {
        acc.nrOfWins = yearResult.maxCategories;
        acc.movies = yearResult.movies;
      } else if (yearResult.maxCategories === acc.nrOfWins) {
        acc.movies.push(...yearResult.movies);
      }

      return acc;
    },
    { nrOfWins: 0, movies: [] }
  );

  return result.movies
    .map((title) => `${title} (${result.nrOfWins})`)
    .join(", ");
};

export const getMostNominationsAllTime = (movies: MoviesYearsListType) => {
  const result = movies.reduce(
    (
      acc: {
        nrOfNominations: number;
        movies: string[];
      },
      year
    ) => {
      const yearResult = year.movies.reduce(
        (acc: WonCategoriesType, movie) => {
          const categoryCount = movie.categories?.length ?? 0;
          if (categoryCount > acc.maxCategories) {
            acc.maxCategories = categoryCount;
            acc.movies = [movie.title];
          } else if (categoryCount === acc.maxCategories) {
            acc.movies.push(movie.title);
          }
          return acc;
        },
        { maxCategories: 0, movies: [] }
      );

      if (yearResult.maxCategories > acc.nrOfNominations) {
        acc.nrOfNominations = yearResult.maxCategories;
        acc.movies = yearResult.movies;
      } else if (yearResult.maxCategories === acc.nrOfNominations) {
        acc.movies.push(...yearResult.movies);
      }

      return acc;
    },
    { nrOfNominations: 0, movies: [] }
  );

  return result.movies
    .map((title) => `${title} (${result.nrOfNominations})`)
    .join(", ");
};

export const getMedianAndAverageMovieLength = (yearMovies: MovieType[]) => {
  const durations = [...yearMovies]
    .filter((movie) => movie.duration && movie.duration > 60)
    .map((movie) => movie.duration ?? 0)
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return {
      median: "No data",
      average: "No data",
    };
  }

  const half = Math.floor(durations.length / 2);

  return {
    median: minutesToHours((durations[half - 1] + durations[half]) / 2),
    average: minutesToHours(
      durations.reduce((acc, duration) => acc + duration, 0) / durations.length
    ),
  };
};

export const getMostNominatedDirector = (movies: MoviesYearsListType) => {
  const directorCount: { [key: string]: number } = {};
  const directorMovies: { [key: string]: string[] } = {};

  movies.forEach((yearData) => {
    yearData.movies.forEach((movie) => {
      const categories = JSON.stringify(movie.categories).toLowerCase();

      if (!categories.includes("director")) return;

      const director = movie.director.toLowerCase();
      if (directorCount[director]) {
        directorCount[director] += 1;
        directorMovies[director].push(movie.title);
      } else {
        directorCount[director] = 1;
        directorMovies[director] = [movie.title];
      }
    });
  });

  let maxNominations = 0;
  let mostNominatedDirector = "";

  for (const director in directorCount) {
    if (directorCount[director] > maxNominations) {
      maxNominations = directorCount[director];
      mostNominatedDirector = director;
    }
  }

  return {
    name: mostNominatedDirector,
    movies: directorMovies[mostNominatedDirector] || [],
  };
};

export const getMostDirectorWins = (movies: MoviesYearsListType) => {
  const directorCount: { [key: string]: number } = {};
  const directorMovies: { [key: string]: string[] } = {};

  movies.forEach((yearData) => {
    yearData.movies.forEach((movie) => {
      const wonCategories = JSON.stringify(movie.wonCategories)?.toLowerCase();

      if (!wonCategories?.includes("director")) return;

      const director = movie.director.toLowerCase();
      if (directorCount[director]) {
        directorCount[director] += 1;
        directorMovies[director].push(movie.title);
      } else {
        directorCount[director] = 1;
        directorMovies[director] = [movie.title];
      }
    });
  });

  let maxNominations = 0;
  let mostNominatedDirector = "";

  for (const director in directorCount) {
    if (directorCount[director] > maxNominations) {
      maxNominations = directorCount[director];
      mostNominatedDirector = director;
    }
  }

  return {
    name: mostNominatedDirector,
    movies: directorMovies[mostNominatedDirector] || [],
  };
};

export const getMostAppearedActor = (movies: MoviesYearsListType) => {
  const actorCount: { [key: string]: number } = {};
  const actorMovies: { [key: string]: string[] } = {};

  movies.forEach((yearData) => {
    yearData.movies.forEach((movie) => {
      const cast = movie.cast.split(", ");
      cast.forEach((actor) => {
        if (actor === "N/A") return;
        const actorLower = actor.toLowerCase();
        if (actorCount[actorLower]) {
          actorCount[actorLower] += 1;
          actorMovies[actorLower].push(movie.title);
        } else {
          actorCount[actorLower] = 1;
          actorMovies[actorLower] = [movie.title];
        }
      });
    });
  });

  let maxAppearances = 0;
  let mostAppearedActor = "";

  for (const actor in actorCount) {
    if (actorCount[actor] > maxAppearances) {
      maxAppearances = actorCount[actor];
      mostAppearedActor = actor;
    }
  }

  return {
    name: mostAppearedActor,
    movies: actorMovies[mostAppearedActor] || [],
  };
};

export interface MaxUserType {
  username: string;
  totalSeen: number;
  years: { year: string; seen: number }[];
}

export function findUserWithMostSeenMovies(usersData: UsersType): MaxUserType {
  const userTotals: Map<
    string,
    { totalSeen: number; years: Map<string, number> }
  > = new Map();

  Object.entries(usersData).forEach(([year, users]) => {
    users.forEach((user) => {
      let userData;

      if (!user.username) {
        return;
      }

      if (BLOCKED_USERS.includes(user.username)) {
        return;
      }

      if (userTotals.has(user.username)) {
        userData = userTotals.get(user.username);
        userData!.totalSeen += user.seen;
        const yearSeen = userData!.years.get(year) || 0;
        userData!.years.set(year, yearSeen + user.seen);
      } else {
        userData = {
          totalSeen: user.seen,
          years: new Map([[year, user.seen]]),
        };
        userTotals.set(user.username, userData);
      }
    });
  });

  let maxUser: MaxUserType = { username: "", totalSeen: 0, years: [] };
  userTotals.forEach((value, key) => {
    const yearsArray = Array.from(value.years, ([year, seen]) => ({
      year,
      seen,
    }));
    if (value.totalSeen > maxUser.totalSeen) {
      maxUser = {
        username: key,
        totalSeen: value.totalSeen,
        years: yearsArray,
      };
    }
  });

  return maxUser;
}

export function getUserDataByUsername(
  username: string,
  usersData: UsersType
): MaxUserType | null {
  let totalSeen = 0;
  const years: { year: string; seen: number }[] = [];

  const userExists = Object.values(usersData).some((users) => {
    return users.some(
      (user) => user?.username?.toLowerCase() === username.toLowerCase()
    );
  });

  if (!userExists) {
    return null;
  }

  Object.entries(usersData).forEach(([year, users]) => {
    const user = users.find(
      (u) => u.username?.toLowerCase() === username.toLowerCase()
    );

    if (!user?.username) {
      return;
    }

    if (user) {
      totalSeen += user.seen;
      years.push({ year, seen: user.seen });
    }
  });

  if (years.length === 0) {
    // If no data is found for the user, you might return null or an empty MaxUserType structure.
    return null; // Or: return { username, totalSeen: 0, years: [] };
  }

  return {
    username,
    totalSeen,
    years,
  };
}

export const getNrOfRacers = (year: string, usersData: UsersType) => {
  if (!usersData[year]) return 0;
  return Object.values(usersData[year]).length;
};
