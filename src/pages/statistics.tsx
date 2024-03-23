import Head from "next/head";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { fetchMovies } from "@/functions/fetchMovies";
import { MovieType, MoviesYearsListType } from "@/types";
import styled from "styled-components";
import { minutesToHours } from "@/utils";
import { useEffect } from "react";

const Wrapper = styled.div`
  padding: 24px 24px 0;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 40px;
  margin-bottom: 16px;

  span {
    font-size: 24px;
    font-weight: 400;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  padding: 10px 24px 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;

  thead {
    tr {
      background-color: var(--color-neutral-700);
      color: var(--color-neutral-0);
    }
  }

  th {
    padding: 8px;
    white-space: nowrap;
    text-align: left;
  }

  td {
    padding: 8px;
  }
`;

const TableRow = styled.tr`
  background-color: var(--color-neutral-200);

  &:nth-child(2n + 1) {
    background-color: var(--color-neutral-300);
  }
`;

const AllTime = styled.div`
  background-color: var(--color-primary-300);
  padding: 16px;
  margin-bottom: 40px;
  border-radius: 8px;
  max-width: 600px;
`;

type WonCategoriesType = {
  maxCategories: number;
  movies: string[];
};

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  const reversedList = movies.reverse();
  return { props: { movies: reversedList } };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
}>;

export default function Statistics({
  movies,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  useEffect(() => {
    document.body.classList.add("main-full-width");

    return () => {
      document.body.classList.remove("main-full-width");
    };
  });

  const getRaceLength = (yearMovies: MovieType[]) => {
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

  const getLongestMovie = (yearMovies: MovieType[]) => {
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

  const getMostWins = (yearMovies: MovieType[]) => {
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
      return "Waiting for the Oscars";
    }

    return result.movies
      .map((title) => `${title} (${result.maxCategories})`)
      .join(", ");
  };

  const getMostNominations = (yearMovies: MovieType[]) => {
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

  const getBestPictureWinner = (yearMovies: MovieType[]) => {
    const bestPictureWinner = yearMovies.find((movie) => {
      return movie.wonCategories?.some((category) => {
        return category === "Best Picture";
      });
    });

    return bestPictureWinner?.title ?? "Waiting for the Oscars";
  };

  const getLongestRace = () => {
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

  const getLongestMovieAllTime = () => {
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

  const getShortestMovieAllTime = () => {
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

  const getMostWinsAllTime = () => {
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

  const getMostNominationsAllTime = () => {
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

  const getMedianAndAverageMovieLength = (yearMovies: MovieType[]) => {
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
        durations.reduce((acc, duration) => acc + duration, 0) /
          durations.length
      ),
    };
  };

  return (
    <>
      <Head>
        <title>Oscars death race</title>
        <meta name="description" content="Oscars death race" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff"></meta>
      </Head>
      <Wrapper>
        <PageTitle>
          Statistics <span>(since 2007)</span>
        </PageTitle>
        <AllTime>
          <p>
            <strong>Most wins:</strong> {getMostWinsAllTime()}
          </p>
          <p>
            <strong>Most nominations:</strong> {getMostNominationsAllTime()}
          </p>
          <p>
            <strong>Longest race:</strong> {getLongestRace()}
          </p>
          <p>
            <strong>Longest movie:</strong> {getLongestMovieAllTime()}
          </p>
          <p>
            <strong>Shortest movie:</strong> {getShortestMovieAllTime()}
          </p>
        </AllTime>
      </Wrapper>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Nr of Movies</th>
              <th>Race length</th>
              <th>Best Picture Winner</th>
              <th>Most wins</th>
              <th>Most nominations</th>
              <th>Average length*</th>
              <th>Longest movie</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((obj) => {
              return (
                <TableRow key={obj.year}>
                  <td>{obj.year}</td>
                  <td style={{ textAlign: "center" }}>{obj.movies.length}</td>
                  <td>{getRaceLength(obj.movies)}</td>
                  <td>{getBestPictureWinner(obj.movies)}</td>
                  <td>{getMostWins(obj.movies)}</td>
                  <td>{getMostNominations(obj.movies)}</td>
                  <td>{getMedianAndAverageMovieLength(obj.movies).average}</td>
                  <td>{getLongestMovie(obj.movies)}</td>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        <p>* Average movie length excludes short films</p>
      </TableWrapper>
    </>
  );
}
