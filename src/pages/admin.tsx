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
import { Button } from "@/components/button";
import { Paragraph } from "@/components/paragraph";

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
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear(yearsList[0]?.value);
    }
  }, [yearsList, selectedYear]);

  if (!isAdmin) {
    return <NotFound />;
  }

  const triggerDeploy = async () => {
    const link = process.env.NEXT_PUBLIC_VERCEL_DEPLOY_HOOK;
    if (!link) {
      return;
    }
    setStatus("Started deploy");

    const res = await fetch(link, {
      method: "GET",
    });
    const json = await res.json();
    if (json.job.state === "PENDING") {
      setStatus("Deploying");
      setTimeout(() => {
        setStatus(undefined);
      }, 90000);
    }
  };

  return (
    <div>
      <Box $marginBottom="xl">
        <Button
          type="button"
          label="Trigger deploy"
          onClick={triggerDeploy}
          disabled={Boolean(status)}
          variant="secondary"
          size="md"
        />
        {<Paragraph>{status}</Paragraph>}
      </Box>
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
