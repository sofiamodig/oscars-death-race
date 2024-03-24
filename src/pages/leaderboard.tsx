import { useEffect, useMemo, useState } from "react";
import Dropdown from "react-dropdown";
import { DateTime } from "luxon";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import { MoviesYearsListType } from "@/types";
import { fetchMovies } from "@/functions/fetchMovies";
import { useSeenContext } from "@/contexts/seenContext";
import { Heading } from "@/components/heading";
import { LeaderboardItem } from "@/components/leaderboardItem";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Loader } from "@/styles/Loader";
import { getYearsList } from "@/utils";
import {
  LeaderboardType,
  LeaderboardUser,
  fetchUsers,
} from "@/functions/fetchUsers";
import { Paragraph } from "@/components/paragraph";

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  const leaderboard = await fetchUsers(movies);

  return { props: { movies, leaderboard } };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
  leaderboard: LeaderboardType;
}>;

export default function Leaderboard({
  movies,
  leaderboard,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [selectedYear, setSelectedYear] = useState<string>();
  const [yearLeaderboard, setYearLeaderboard] = useState<LeaderboardUser[]>();
  const [usersList, setUsersList] = useState<LeaderboardUser[]>();
  const { seenMovies, userSettings, loading } = useSeenContext();
  const { yearsList } = getYearsList(movies);

  useEffect(() => {
    if (selectedYear) {
      setUsersList(undefined);
      setYearLeaderboard(leaderboard[selectedYear]);
    }
  }, [selectedYear]);

  const yearMovies =
    movies.find((movie) => movie.year === selectedYear)?.movies ?? [];

  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear(yearsList[0].value);
    }
  }, [yearsList, selectedYear]);

  useEffect(() => {
    const updatedUsersList = yearLeaderboard?.map((user, i) => {
      if (user.username === userSettings?.username) {
        const seenMoviesImdbIds = seenMovies
          ?.find((list) => list.year === selectedYear)
          ?.seenMovies.map((movie) => movie.imdbId);

        const uniqueSeenMoviesImdbIds = Array.from(new Set(seenMoviesImdbIds));

        const seenCount =
          yearMovies?.filter((movie) =>
            uniqueSeenMoviesImdbIds?.includes(movie.imdbId)
          ).length ?? 0;
        const totalMovies = yearMovies?.length ?? 0;
        const percentage =
          totalMovies > 0 ? Math.round((seenCount / totalMovies) * 100) : 0;

        return {
          ...user,
          seen: seenCount,
          percentage: percentage,
        };
      } else {
        return user;
      }
    });

    const sortedUsersList = updatedUsersList?.sort((a, b) => {
      if (a.seen > b.seen) {
        return -1;
      } else if (a.seen < b.seen) {
        return 1;
      } else {
        const dateA = a.completed
          ? DateTime.fromISO(a.completed)
          : DateTime.now();
        const dateB = b.completed
          ? DateTime.fromISO(b.completed)
          : DateTime.now();
        return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
      }
    });

    setUsersList(sortedUsersList);
  }, [selectedYear, yearLeaderboard]);

  return (
    <Box $maxWidth="980px" $marginLeft="auto" $marginRight="auto">
      <Flex $marginBottom="sm">
        <div>
          <Heading as="h1" size="xl" marginBottom="xs">
            Leaderboard
          </Heading>
          <Paragraph size="sm">
            The leaderboard is updated once per day. The interval is shortened
            closer to the oscars.
          </Paragraph>
        </div>
        <div className="custom-select-wrapper" style={{ width: "90px" }}>
          <select onChange={(e) => setSelectedYear(e.target.value)}>
            {yearsList.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
      </Flex>
      {loading || !yearMovies?.length ? (
        <Flex $justifyContent="center" $marginTop="lg">
          <Loader />
        </Flex>
      ) : (
        <div>
          {usersList?.map((user, i) => {
            if (!user.username) return null;

            return (
              <LeaderboardItem
                key={selectedYear + user.username + Math.random()}
                username={user.username}
                percentage={user.percentage}
                completed={
                  parseInt(selectedYear ?? "0") > 2020 ? user.completed : null
                }
                isCurrentUser={user.username === userSettings?.username}
                rank={i}
              />
            );
          })}
        </div>
      )}
    </Box>
  );
}
