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
  const allUsers = Object.values(leaderboard).flat();

  const totalNrOfMovies = movies.map((year) => year.movies).flat().length;

  // map through all users and if a user with the same id is found, the user should only be once in the array
  const allUsersFinal = allUsers.reduce(
    (
      acc: {
        id: string;
        username: string;
        seen: number;
      }[],
      user
    ) => {
      if (!user.username) return acc;

      const existingUser = acc.find((u) => u.id === user.id);
      if (!existingUser) {
        acc.push({
          id: user.id,
          username: user.username,
          seen: user.seen,
        });
      } else {
        existingUser.seen += user.seen;
      }
      return acc;
    },
    []
  );

  // After accumulating the seen counts, calculate the percentage
  const allUsersWithPercentage = allUsersFinal.map((user) => ({
    ...user,
    percentage: Math.round((user.seen / totalNrOfMovies) * 100),
  }));

  const sortBySeen = [...allUsersWithPercentage].sort(
    (a, b) => b.seen - a.seen
  );

  return {
    props: {
      movies,
      leaderboard,
      allUsers: sortBySeen.slice(0, 100),
      totalNrOfMovies: totalNrOfMovies,
    },
  };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
  leaderboard: LeaderboardType;
  allUsers: {
    id: string;
    username: string;
    seen: number;
    percentage: number;
  }[];
  totalNrOfMovies: number;
}>;

export default function Leaderboard({
  movies,
  leaderboard,
  allUsers,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [selectedYear, setSelectedYear] = useState<string>();
  const [yearLeaderboard, setYearLeaderboard] = useState<LeaderboardUser[]>();
  const [usersList, setUsersList] = useState<LeaderboardUser[]>();
  const { seenMovies, userSettings, loading } = useSeenContext();
  const { yearsList } = getYearsList(movies);

  useEffect(() => {
    if (selectedYear === "all") {
      setUsersList(allUsers);
      setYearLeaderboard([]);
    } else if (selectedYear) {
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
    if (selectedYear === "all") {
      return;
    }

    const updatedUsersList =
      yearLeaderboard?.map((user, i) => {
        if (user.username === userSettings?.username) {
          const seenMoviesImdbIds = seenMovies
            ?.find((list) => list.year === selectedYear)
            ?.seenMovies.map((movie) => movie.imdbId);

          const uniqueSeenMoviesImdbIds = Array.from(
            new Set(seenMoviesImdbIds)
          );

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
      }) ?? [];

    const sortedUsersList = [...updatedUsersList]
      ?.sort((a, b) => {
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
      })
      .filter((user) => user.username);

    setUsersList(sortedUsersList);
  }, [selectedYear, yearLeaderboard]);

  return (
    <Box $maxWidth="980px" $marginLeft="auto" $marginRight="auto">
      <Flex $marginBottom="sm" $alignItems="flex-start">
        <div>
          <Heading as="h1" size="xl" marginBottom="xs">
            Leaderboard
          </Heading>
          <Paragraph size="sm">
            The leaderboard is updated once per day. The interval is shortened
            closer to the oscars.
          </Paragraph>
          {selectedYear === "all" && (
            <Paragraph size="sm">
              All years are combined to the ultimate race! 🏆 In total there are{" "}
              {movies.map((year) => year.movies).flat().length} movies to watch.
              This list shows the top 100 users.
            </Paragraph>
          )}
        </div>
        <div
          className="custom-select-wrapper"
          style={{ width: "120px", flexShrink: "0" }}
        >
          <select onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="all">All years</option>
            {yearsList.map((year, i) => (
              <option key={year.value} value={year.value} selected={i === 0}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
      </Flex>
      {loading ? (
        <Flex $justifyContent="center" $marginTop="lg">
          <Loader />
        </Flex>
      ) : (
        <div>
          {usersList?.map((user, i) => {
            return (
              <LeaderboardItem
                key={selectedYear + user.id}
                username={user.username ?? "unknown"}
                percentage={user.percentage}
                completed={
                  parseInt(selectedYear ?? "0") > 2020 ? user.completed : null
                }
                seen={selectedYear === "all" ? user.seen : undefined}
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
