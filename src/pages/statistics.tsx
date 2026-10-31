import Head from "next/head";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { useEffect } from "react";
import SeenLineChart from "@/components/seenLineChart";
import { useAuth } from "@/hooks/useAuth";
import { useMovieCatalog } from "@/hooks/useMovieCatalog";
import { readMovieCatalog } from "@/functions/readMovieCatalog";
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

type StatisticsRow = {
  year: string;
  movieCount: number;
  raceLength: string;
  bestPictureWinner: string;
  mostWins: string;
  mostNominations: string;
  averageLength: string;
  longestMovie: string;
};

type StatisticsSummary = {
  mostWins: string;
  mostNominations: string;
  longestRace: string;
  longestMovie: string;
  shortestMovie: string;
  mostDirectorWins: ReturnType<typeof getMostDirectorWins>;
  mostNominatedDirector: ReturnType<typeof getMostNominatedDirector>;
  mostAppearedActor: ReturnType<typeof getMostAppearedActor>;
};

export const getStaticProps = (async () => {
  const [catalog, racerCountsByYear, usernames] = await Promise.all([
    readMovieCatalog(),
    fetchRacerCountsByYear(),
    fetchLeaderboardUsernames(),
  ]);
  const reversedList = [...catalog].reverse();
  const summary: StatisticsSummary = {
    mostWins: getMostWinsAllTime(catalog),
    mostNominations: getMostNominationsAllTime(catalog),
    longestRace: getLongestRace(catalog),
    longestMovie: getLongestMovieAllTime(catalog),
    shortestMovie: getShortestMovieAllTime(catalog),
    mostDirectorWins: getMostDirectorWins(catalog),
    mostNominatedDirector: getMostNominatedDirector(catalog),
    mostAppearedActor: getMostAppearedActor(catalog),
  };
  const rows: StatisticsRow[] = reversedList.map(({ year, movies }) => ({
    year,
    movieCount: movies.length,
    raceLength: getRaceLength(movies),
    bestPictureWinner: getBestPictureWinner(movies),
    mostWins: getMostWins(movies),
    mostNominations: movies.length ? getMostNominations(movies) : "No data",
    averageLength: getMedianAndAverageMovieLength(movies).average,
    longestMovie: getLongestMovie(movies),
  }));

  return {
    props: { summary, rows, racerCountsByYear, usernames },
    revalidate: 86400,
  };
}) satisfies GetStaticProps<{
  summary: StatisticsSummary;
  rows: StatisticsRow[];
  racerCountsByYear: RacerCountsByYear;
  usernames: string[];
}>;

export default function Statistics({
  summary,
  rows,
  racerCountsByYear,
  usernames,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { isSignedIn } = useAuth();
  const { movies } = useMovieCatalog();
  useEffect(() => {
    document.body.classList.add("main-full-width");

    return () => {
      document.body.classList.remove("main-full-width");
    };
  });

  // General stats
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
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
      </Head>
      <div className="mx-auto max-w-[1400px] px-6 pt-6">
        <h1 className="mb-4 text-[40px]">Statistics</h1>
        <div className="mb-2 max-w-[600px] rounded-lg bg-[#e2cd7a] p-4 dark:bg-[#968242] dark:text-neutral-800">
          <p>
            <strong>Most wins:</strong> {summary.mostWins}
          </p>
          <p>
            <strong>Most nominations:</strong> {summary.mostNominations}
          </p>
          <p>
            <strong>Longest race:</strong> {summary.longestRace}
          </p>
          <p>
            <strong>Longest movie:</strong> {summary.longestMovie}
          </p>
          <p>
            <strong>Shortest movie:</strong> {summary.shortestMovie}
          </p>
          <p>
            <strong style={{ display: "block" }}>
              Most director wins:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {summary.mostDirectorWins.name} ({summary.mostDirectorWins.movies.length})
              </span>
            </strong>
            {summary.mostDirectorWins.movies.join(", ")}
          </p>
          <p>
            <strong style={{ display: "block" }}>
              Most nominated director:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {summary.mostNominatedDirector.name} (
                {summary.mostNominatedDirector.movies.length})
              </span>
            </strong>
            {summary.mostNominatedDirector.movies.join(", ")}
          </p>
          <p>
            <strong style={{ display: "block" }}>
              Appeared most times*:{" "}
              <span style={{ textTransform: "capitalize" }}>
                {summary.mostAppearedActor.name} ({summary.mostAppearedActor.movies.length})
              </span>
            </strong>
            {summary.mostAppearedActor.movies.join(", ")}
          </p>
        </div>
        <p style={{ fontSize: "12px" }}>
          * Listed in &quot;Stars&quot; on IMDB
        </p>
      </div>

      {isSignedIn && movies && (
        <div className="mx-auto w-full max-w-[1400px] overflow-visible p-6">
          <SeenLineChart movies={movies} usernames={usernames} />
        </div>
      )}

      <div className="mx-auto w-full max-w-[1400px] overflow-x-auto p-6">
        <table className="mb-2 w-full border-collapse [&_thead_tr]:bg-neutral-700 [&_thead_tr]:text-white dark:[&_thead_tr]:bg-neutral-950 [&_th]:whitespace-nowrap [&_th]:p-2 [&_th]:text-left [&_td]:p-2">
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
            {rows.map((row) => {
              return (
                <tr key={"statistics-" + row.year} className="bg-neutral-200 odd:bg-neutral-300 dark:bg-neutral-700 dark:odd:bg-neutral-700">
                  <td>{row.year}</td>
                  <td style={{ textAlign: "center" }}>{row.movieCount}</td>
                  <td>{row.raceLength}</td>
                  <td>{row.bestPictureWinner}</td>
                  <td>{row.mostWins}</td>
                  <td>{row.mostNominations}</td>
                  <td>{row.averageLength}</td>
                  <td>{row.longestMovie}</td>
                  <td style={{ textAlign: "center" }}>
                    {getNrOfRacers(row.year, racerCountsByYear)}
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
