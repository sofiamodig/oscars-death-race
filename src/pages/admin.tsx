import { useEffect, useMemo, useState } from "react";
import { GetStaticProps, InferGetStaticPropsType } from "next";
import EditMovie from "@/components/editMovie";
import AddMovie from "@/components/addMovie";
import { Heading } from "@/components/heading";
import { fetchMovies } from "@/functions/fetchMovies";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { MoviesYearsListType } from "@/types";
import { getYearsList } from "@/utils";
import Dropdown from "react-dropdown";
import NotFound from "./404";

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  return { props: { movies } };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
}>;

export default function Admin({
  movies,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { isAdmin } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string>();
  const { yearsList } = getYearsList(movies);
  const yearMovies = useMemo(
    () => movies.find((movie) => movie.year === selectedYear)?.movies,
    [movies, selectedYear]
  );

  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear(yearsList[0]?.value);
    }
  }, [yearsList]);

  if (!isAdmin) {
    return <NotFound />;
  }

  return (
    <div>
      <AddMovie />

      <Flex
        $marginTop="xl"
        $justifyContent="space-between"
        $alignItems="center"
      >
        <Heading size="lg">Edit movies</Heading>
        <Dropdown
          options={yearsList}
          onChange={(option) => {
            setSelectedYear(option.value);
          }}
          value={selectedYear}
          placeholder="Year"
        />
      </Flex>

      <Box>
        {selectedYear &&
          yearMovies?.map((movie) => (
            <EditMovie
              key={movie.id}
              id={movie.id}
              title={movie.title}
              selectedYear={selectedYear}
              initialNominatedCategories={movie.categories || []}
              initialWonCategories={movie.wonCategories || []}
              initialYear={selectedYear}
              initialPosterUrl={movie.posterUrl}
            />
          ))}
      </Box>
    </div>
  );
}
