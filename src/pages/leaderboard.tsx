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
import { LeaderboardType, fetchUsers } from "@/functions/fetchUsers";
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
  const yearLeaderboard = selectedYear ? leaderboard[selectedYear] : null;
  const { seenMovies, userSettings, loading } = useSeenContext();
  const { yearsList } = getYearsList(movies);

  const yearMovies = useMemo(
    () => movies.find((movie) => movie.year === selectedYear)?.movies,
    [movies, selectedYear]
  );

  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear(yearsList[0].value);
    }
  }, [yearsList]);

  const updatedUsersList = yearLeaderboard?.map((user) => {
    if (user.username === userSettings?.username) {
      const seenMoviesImdbIds = seenMovies
        ?.find((list) => list.year === selectedYear)
        ?.seenMovies.map((movie) => movie.imdbId);

      const seenCount =
        yearMovies?.filter((movie) => seenMoviesImdbIds?.includes(movie.imdbId))
          .length ?? 0;
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

  return (
    <Box $maxWidth="980px" $marginLeft="auto" $marginRight="auto">
      <Flex $marginBottom="sm">
        <div>
          <Heading as="h1" size="xl" marginBottom="xs">
            Leaderboard
          </Heading>
          <Paragraph size="sm">
            The leaderboard is updated every 2 hours. The interval will be
            shortened closer to the oscars.
          </Paragraph>
        </div>
        <Dropdown
          options={yearsList}
          onChange={(option) => {
            setSelectedYear(option.value);
          }}
          value={selectedYear}
          placeholder="Year"
        />
      </Flex>
      {loading || !yearMovies?.length ? (
        <Flex $justifyContent="center" $marginTop="lg">
          <Loader />
        </Flex>
      ) : (
        <div>
          {sortedUsersList?.map((user, i) => {
            if (!user.username) return null;

            return (
              <LeaderboardItem
                key={user.username}
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
