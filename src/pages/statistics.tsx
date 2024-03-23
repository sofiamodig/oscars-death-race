import Head from "next/head";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { fetchMovies } from "@/functions/fetchMovies";
import { MovieType, MoviesYearsListType } from "@/types";
import styled from "styled-components";

const Wrapper = styled.div`
  padding: 24px;
`;

type WonCategoriesType = {
  maxCategories: number;
  movies: string[];
};

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  return { props: { movies } };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
}>;

export default function Statistics({
  movies,
}: InferGetStaticPropsType<typeof getStaticProps>) {
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

  const reversedList = movies.reverse();

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
      <main>
        <Wrapper>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Nr of Movies</th>
                <th>Race length</th>
                <th>Best Picture Winner</th>
                <th>Most wins</th>
                <th>Most nominations</th>
              </tr>
            </thead>
            <tbody>
              {reversedList.map((obj) => {
                return (
                  <tr>
                    <td>{obj.year}</td>
                    <td>{obj.movies.length}</td>
                    <td>{getRaceLength(obj.movies)}</td>
                    <td>{getBestPictureWinner(obj.movies)}</td>
                    <td>{getMostWins(obj.movies)}</td>
                    <td>{getMostNominations(obj.movies)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Wrapper>
      </main>
    </>
  );
}