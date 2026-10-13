import { useEffect, useMemo, useRef, useState } from "react";
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
  fetchLeaderboardInitial,
  fetchUsersForYear,
} from "@/functions/fetchUsers";
import { Paragraph } from "@/components/paragraph";

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  const totalNrOfMovies = movies.map((year) => year.movies).flat().length;
  const latestYear = movies.at(-1)?.year;
  if (!latestYear) throw new Error("No movie years are available for the leaderboard.");

  const { yearUsers: latestYearUsers, allTimeUsers: allUsers } =
    await fetchLeaderboardInitial(latestYear);
  const leaderboard = { [String(latestYear)]: latestYearUsers };

  return {
    props: {
      movies,
      leaderboard,
      allUsers,
      totalNrOfMovies: totalNrOfMovies,
    },
    revalidate: 86400,
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
  const [isYearLoading, setIsYearLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string>();
  const leaderboardCache = useRef(leaderboard);
  const { seenMovies, userSettings, loading } = useSeenContext();
  const { yearsList } = getYearsList(movies);

  useEffect(() => {
    if (!selectedYear) return;

    if (selectedYear === "all") {
      setUsersList(allUsers);
      setYearLeaderboard([]);
      setIsYearLoading(false);
      setLeaderboardError(undefined);
    } else if (selectedYear) {
      setUsersList(undefined);
      const cachedUsers = leaderboardCache.current[selectedYear];
      if (cachedUsers) {
        setYearLeaderboard(cachedUsers);
        setIsYearLoading(false);
        setLeaderboardError(undefined);
        return;
      }

      let cancelled = false;
      setYearLeaderboard(undefined);
      setIsYearLoading(true);
      setLeaderboardError(undefined);
      fetchUsersForYear(Number(selectedYear))
        .then((users) => {
          if (!cancelled) {
            leaderboardCache.current[selectedYear] = users;
            setYearLeaderboard(users);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setLeaderboardError(
              error instanceof Error ? error.message : "Could not load this leaderboard."
            );
          }
        })
        .finally(() => {
          if (!cancelled) setIsYearLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [selectedYear, allUsers]);

  const yearMovies = useMemo(
    () => movies.find((movie) => movie.year === Number(selectedYear))?.movies ?? [],
    [movies, selectedYear]
  );

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
          const uniqueSeenMoviesImdbIds = new Set(seenMoviesImdbIds);

          const seenCount =
            yearMovies?.filter((movie) =>
              uniqueSeenMoviesImdbIds.has(movie.imdbId)
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
  }, [
    selectedYear,
    yearLeaderboard,
    seenMovies,
    userSettings?.username,
    yearMovies,
  ]);

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
          {/* <Paragraph size="sm">
            The leaderboard is updated every 20 minutes.
          </Paragraph> */}
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
      {loading || isYearLoading ? (
        <Flex $justifyContent="center" $marginTop="lg">
          <Loader />
        </Flex>
      ) : leaderboardError ? (
        <Paragraph>{leaderboardError}</Paragraph>
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
