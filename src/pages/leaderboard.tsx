import { useEffect, useMemo, useState } from "react";
import Dropdown from "react-dropdown";
import { collection, getDocs } from "@firebase/firestore";
import { DateTime } from "luxon";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import { MovieType, MoviesYearsListType, SeenType } from "@/types";
import { fetchMovies } from "@/functions/fetchMovies";
import { useSeenContext } from "@/contexts/seenContext";
import { Heading } from "@/components/heading";
import { LeaderboardItem } from "@/components/leaderboardItem";
import { Paragraph } from "@/components/paragraph";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Loader } from "@/styles/Loader";
import { getYearsList } from "@/utils";

type User = {
  id: string;
  username: string;
  seen: number;
  percentage: number;
  completed: string | null;
};

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  return { props: { movies } };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
}>;

export default function Home({
  movies,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { isSignedIn } = useAuth();
  const { userSettings } = useSeenContext();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>();
  const [loading, setLoading] = useState(true);
  const { yearsList, latestYear } = getYearsList(movies);
  const yearMovies = useMemo(
    () => movies.find((movie) => movie.year === selectedYear)?.movies,
    [movies, selectedYear]
  );
  const [querySnapshot, setQuerySnapshot] = useState<any>();

  useEffect(() => {
    if (!selectedYear && latestYear) {
      setSelectedYear(latestYear.value);
    }
  }, [latestYear]);

  const fetchUsers = async () => {
    setLoading(true);
    const usersRef = collection(db, "users");

    const querySnapshot = await getDocs(usersRef);
    setQuerySnapshot(querySnapshot);
  };

  const formatUsersList = (selectedYear: string, yearMovies: MovieType[]) => {
    const usersArray = [];

    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      const username = userData.username;
      const seenMovies = userData[selectedYear]?.seenMovies || [];
      if (!seenMovies.length) {
        continue;
      }

      if (userData.showInLeaderboard === false) {
        continue;
      }

      const filteredMovies = seenMovies.filter((movie: SeenType) => {
        return yearMovies.some(
          (yearMovie) => yearMovie.imdbId === movie.imdbId
        );
      });

      usersArray.push({
        id: doc.id,
        username,
        seen: filteredMovies.length,
        percentage: Math.round(
          (filteredMovies.length / yearMovies?.length) * 100
        ),
        completed: userData[selectedYear].completed ?? null,
      });
    }

    setLoading(false);
    setUsersList(usersArray);
  };

  useEffect(() => {
    if (!querySnapshot || !selectedYear || !userSettings || !yearMovies) {
      return;
    }

    formatUsersList(selectedYear, yearMovies);
  }, [userSettings, selectedYear, querySnapshot, yearMovies]);

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!isSignedIn) {
    return (
      <Flex $direction="column" $alignItems="center" $marginTop="xl">
        <Heading as="h1" size="xl" marginBottom="sm">
          Leaderboard
        </Heading>
        <Paragraph>You need to be signed in to view the leaderboard</Paragraph>
      </Flex>
    );
  }

  const sortedUsersList = usersList.sort((a, b) => {
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
        <Heading as="h1" size="xl">
          Leaderboard
        </Heading>
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
          {sortedUsersList.map((user, i) => {
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
