import Head from "next/head";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { fetchMovies } from "@/functions/fetchMovies";
import { MoviesYearsListType } from "@/types";
import { useEffect } from "react";
import SeenLineChart from "@/components/seenLineChart";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLeaderboardUsernames,
  fetchRacerCountsByYear,
  RacerCountsByYear,
} from "@/functions/fetchUsers";
import {
  getBestPictureWinner,
  getLongestMovie,
  getLongestMovieAllTime,
  getLongestRace,
  getMedianAndAverageMovieLength,
  getMostAppearedActor,
  getMostDirectorWins,
  getMostNominatedDirector,
  getMostNominations,
  getMostNominationsAllTime,
  getMostWins,
  getMostWinsAllTime,
  getNrOfRacers,
  getRaceLength,
  getShortestMovieAllTime,
} from "@/functions/statisticsFunctions";

export const getStaticProps = (async () => {
  const [movies, racerCountsByYear, usernames] = await Promise.all([
    fetchMovies(),
    fetchRacerCountsByYear(),
    fetchLeaderboardUsernames(),
  ]);
  const reversedList = movies.reverse();

  return {
    props: { movies: reversedList, racerCountsByYear, usernames },
    revalidate: 86400,
  };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
  racerCountsByYear: RacerCountsByYear;
  usernames: string[];
}>;

export default function Statistics({
  movies,
  racerCountsByYear,
  usernames,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { isSignedIn } = useAuth();
  useEffect(() => {
    document.body.classList.add("main-full-width");

    return () => {
      document.body.classList.remove("main-full-width");
    };
  });

  // General stats
  const mostWins = getMostWinsAllTime(movies);
  const mostNominations = getMostNominationsAllTime(movies);
  const longestRace = getLongestRace(movies);
  const longestMovie = getLongestMovieAllTime(movies);
  const shortestMovie = getShortestMovieAllTime(movies);
  const mostDirectorWins = getMostDirectorWins(movies);
  const mostNominatedDirector = getMostNominatedDirector(movies);
  const mostAppearedActor = getMostAppearedActor(movies);

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
      <div className="mx-auto max-w-[1400px] px-md pt-md">
        <h1 className="mb-sm text-[40px]">Statistics</h1>
        <div className="mb-xs max-w-[600px] rounded-lg bg-primary-300 p-sm">
          <p>
            <strong>Most wins:</strong> {mostWins}
          </p>
          <p>
            <strong>Most nominations:</strong> {mostNominations}
          </p>
          <p>
            <strong>Longest race:</strong> {longestRace}
          </p>
          <p>
            <strong>Longest movie:</strong> {longestMovie}
          </p>
          <p>
            <strong>Shortest movie:</strong> {shortestMovie}
          </p>
          <p>
            <strong style={{ display: "block" }}>
              Most director wins:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {mostDirectorWins.name} ({mostDirectorWins.movies.length})
              </span>
            </strong>
            {mostDirectorWins.movies.join(", ")}
          </p>
          <p>
            <strong style={{ display: "block" }}>
              Most nominated director:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {mostNominatedDirector.name} (
                {mostNominatedDirector.movies.length})
              </span>
            </strong>
            {mostNominatedDirector.movies.join(", ")}
          </p>
          <p>
            <strong style={{ display: "block" }}>
              Appeared most times*:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {mostAppearedActor.name} ({mostAppearedActor.movies.length})
              </span>
            </strong>
            {mostAppearedActor.movies.join(", ")}
          </p>
        </div>
        <p style={{ fontSize: "12px" }}>
          * Listed in &quot;Stars&quot; on IMDB
        </p>
      </div>

      {isSignedIn && (
        <div className="mx-auto w-full max-w-[1400px] overflow-visible p-md">
          <SeenLineChart
            movies={[...movies].reverse()}
            usernames={usernames}
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-[1400px] overflow-x-auto p-md">
        <table className="mb-xs w-full border-collapse [&_thead_tr]:bg-neutral-700 [&_thead_tr]:text-neutral-0 [&_th]:whitespace-nowrap [&_th]:p-2 [&_th]:text-left [&_td]:p-2">
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
              <th>Nr of racers</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((obj) => {
              return (
                <tr key={"statistics-" + obj.year} className="bg-neutral-200 odd:bg-neutral-300">
                  <td>{obj.year}</td>
                  <td style={{ textAlign: "center" }}>{obj.movies.length}</td>
                  <td>{getRaceLength(obj.movies)}</td>
                  <td>{getBestPictureWinner(obj.movies)}</td>
                  <td>{getMostWins(obj.movies)}</td>
                  <td>
                    {obj.movies.length
                      ? getMostNominations(obj.movies)
                      : "No data"}
                  </td>
                  <td>{getMedianAndAverageMovieLength(obj.movies).average}</td>
                  <td>{getLongestMovie(obj.movies)}</td>
                  <td style={{ textAlign: "center" }}>
                    {getNrOfRacers(obj.year, racerCountsByYear)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p style={{ fontSize: "12px" }}>
          * Average movie length excludes short films
        </p>
      </div>
    </>
  );
}
