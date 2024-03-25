import Head from "next/head";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { fetchMovies } from "@/functions/fetchMovies";
import { MovieType, MoviesYearsListType } from "@/types";
import styled from "styled-components";
import { minutesToHours } from "@/utils";
import { useContext, useEffect } from "react";
import { SeenContext } from "@/contexts/seenContext";
import SeenLineChart from "@/components/seenLineChart";
import { useAuth } from "@/hooks/useAuth";
import { fetchUsers } from "@/functions/fetchUsers";
import {
  findUserWithMostSeenMovies,
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
  getRaceLength,
  getShortestMovieAllTime,
} from "@/functions/statisticsFunctions";

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

const ChartWrapper = styled.div`
  overflow-x: auto;
  padding: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  padding: 24px;
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
  margin-bottom: 8px;
  border-radius: 8px;
  max-width: 600px;
`;

const Name = styled.span`
  text-transform: capitalize;
`;

type User = {
  username: string;
  seen: number;
  percentage: number;
  completed: string | null;
  seenDuration: number;
};

export interface UsersType {
  [year: string]: User[];
}

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  const reversedList = movies.reverse();
  const users = await fetchUsers(movies);

  return { props: { movies: reversedList, users } };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
  users: UsersType;
}>;

export default function Statistics({
  movies,
  users,
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

  // User stats
  const bestUser = findUserWithMostSeenMovies(users);

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
          Statistics <span>(since 1968)</span>
        </PageTitle>
        <p>More years to be added in the next days..</p>
        <AllTime>
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
        </AllTime>
        <p style={{ fontSize: "12px" }}>
          * Listed in &quot;Stars&quot; on IMDB
        </p>
      </Wrapper>

      {isSignedIn && (
        <ChartWrapper>
          <SeenLineChart
            movies={[...movies].reverse()}
            bestUser={bestUser}
            users={users}
          />
        </ChartWrapper>
      )}

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
                <TableRow key={"statistics-" + obj.year}>
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
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        <p style={{ fontSize: "12px" }}>
          * Average movie length excludes short films
        </p>
      </TableWrapper>
    </>
  );
}
