import Head from "next/head";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { fetchMovies } from "@/functions/fetchMovies";
import { MoviesYearsListType } from "@/types";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  checkLatestYear,
  cleanupCategory,
  formatCategory,
  getYearsList,
} from "@/utils";
import { MovieCard } from "@/components/movieCard";
import { MovieCardSkeleton } from "@/components/movieCardSkeleton";
import { Paragraph } from "@/components/paragraph";
import { ProgressBar } from "@/components/progressBar";
import { Toggle } from "@/components/toggle";
import { Box } from "@/styles/Box";
import { InfoMessage } from "@/styles/Message";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { SeenContext } from "@/contexts/seenContext";
import Dropdown from "react-dropdown";
import { InfoIcon } from "@/assets/icons/InfoIcon";
import { AllDone } from "@/components/allDone";
import { SiteInfoContext } from "@/contexts/siteInfoContext";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
  gap: 24px;

  @media (max-width: 450px) {
    grid-template-columns: 1fr;
  }
`;

const BarWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;

  @media (min-width: 768px) {
    & > div:last-child {
      margin-left: auto;
    }
  }
`;

const SubBarWrapper = styled.div`
  margin-bottom: 16px;

  @media (min-width: 768px) {
    p {
      text-align: right;
    }
  }
`;

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
  const { seenMovies, loading } = useContext(SeenContext);
  const [onlyShowWinners, setOnlyShowWinners] = useState<boolean>(false);
  const [hideSeen, setHideSeen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedYear, setSelectedYear] = useState<string>();
  const { yearsList, latestYear } = getYearsList(movies);
  const { predictions, moviesBeingAdded } = useContext(SiteInfoContext);

  useEffect(() => {
    if (localStorage.getItem("hideSeen")) {
      setHideSeen(localStorage.getItem("hideSeen") === "true");
    }
  }, []);

  const isLatestYear = selectedYear
    ? checkLatestYear(selectedYear, movies)
    : false;

  const yearObj = movies.find((obj) => obj.year === selectedYear);

  const moviesList = yearObj ? yearObj.movies : undefined;

  const yearHasWinners = moviesList?.some((movie) => {
    return movie.wonCategories && movie.wonCategories.length > 0;
  });

  useEffect(() => {
    if (!selectedYear && latestYear) {
      setSelectedYear(latestYear.value);
    }

    if (!yearHasWinners) {
      setOnlyShowWinners(false);
    }

    if (isLatestYear && predictions) {
      setSelectedCategory(undefined);
    }
  }, [selectedYear, latestYear, predictions, yearHasWinners, isLatestYear]);

  const seenMoviesImdbIds = seenMovies
    .find((list) => list.year === selectedYear)
    ?.seenMovies?.map((movie) => movie.imdbId);

  const uniqueSeenMoviesImdbIds = Array.from(new Set(seenMoviesImdbIds));

  const seenMoviesList = yearObj?.movies.filter((movie) => {
    return uniqueSeenMoviesImdbIds?.includes(movie.imdbId);
  });

  const filteredMovies = useMemo(() => {
    if (selectedCategory) {
      const filteredByCategory = moviesList?.filter((movie) => {
        return movie.categories?.some(
          (category) => cleanupCategory(category) === selectedCategory
        );
      });

      if (onlyShowWinners) {
        return filteredByCategory?.filter((movie) => {
          return movie.wonCategories?.find(
            (cat) => cleanupCategory(cat) === selectedCategory
          );
        });
      } else {
        return filteredByCategory;
      }
    } else {
      if (onlyShowWinners) {
        return moviesList?.filter((movie) => {
          return movie.wonCategories && movie.wonCategories.length > 0;
        });
      } else {
        return moviesList;
      }
    }
  }, [moviesList, onlyShowWinners, selectedCategory]);

  const moviesToDisplay = useMemo(() => {
    if (hideSeen) {
      return filteredMovies?.filter((movie) => {
        return !seenMoviesList?.some(
          (seenMovie) => seenMovie.imdbId === movie.imdbId
        );
      });
    } else {
      return filteredMovies;
    }
  }, [filteredMovies, hideSeen, seenMoviesList]);

  if (loading || !selectedYear) {
    return (
      <Wrapper>
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
      </Wrapper>
    );
  }

  const toggleHideSeen = () => {
    setHideSeen(!hideSeen);
    localStorage.setItem("hideSeen", (!hideSeen).toString());
  };

  const categoriesList = CATEGORIES.map((category) => ({
    value: cleanupCategory(category),
    label: formatCategory(category),
  }));

  const getNrOfMoviesText = () => {
    if (!isSignedIn) {
      return `${moviesToDisplay?.length ?? "-"} movies`;
    }

    const seenMoviesInCategory = seenMoviesList?.filter((movie) => {
      return filteredMovies?.some((filteredMovie) => {
        return filteredMovie.imdbId === movie.imdbId;
      });
    });

    if (selectedCategory) {
      return `${seenMoviesInCategory?.length ?? 0} / ${
        filteredMovies?.length
      } movies`;
    } else {
      return `${seenMoviesList?.length ?? 0} / ${
        filteredMovies?.length
      } movies`;
    }
  };

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
      <main>
        <>
          {isLatestYear && predictions && (
            <Box>
              <InfoMessage $width="100%">
                <InfoIcon />
                These movies are predictions for the upcoming race, not the
                actual nominations.
              </InfoMessage>
            </Box>
          )}
          {isLatestYear && moviesBeingAdded && (
            <Box>
              <InfoMessage $width="100%">
                <InfoIcon />
                Movies are currently being added so the list is not yet
                complete. Please check back later.
              </InfoMessage>
            </Box>
          )}
          <BarWrapper>
            <Dropdown
              options={yearsList}
              onChange={(option) => {
                setSelectedYear(option.value);
              }}
              value={selectedYear}
              placeholder="Year"
            />
            {(!isLatestYear || (isLatestYear && !predictions)) && (
              <Dropdown
                className="cat-dropdown"
                options={[
                  { value: "", label: "All categories" },
                  ...categoriesList,
                ]}
                onChange={(option) => {
                  setSelectedCategory(option.value);
                }}
                value={selectedCategory ?? undefined}
                placeholder="All categories"
              />
            )}
            {yearHasWinners && (
              <Toggle
                label="Only show winners"
                value={onlyShowWinners}
                onToggle={() => setOnlyShowWinners(!onlyShowWinners)}
              />
            )}
            {isSignedIn && (
              <Toggle
                label="Hide seen movies"
                value={hideSeen}
                onToggle={toggleHideSeen}
              />
            )}
          </BarWrapper>
          <SubBarWrapper>
            <Paragraph size="xs">{getNrOfMoviesText()}</Paragraph>
          </SubBarWrapper>
          <Wrapper>
            {moviesToDisplay?.map((movie) => (
              <MovieCard
                key={movie.imdbId}
                data={movie}
                seenList={seenMoviesList ?? []}
                selectedYear={selectedYear}
                movies={movies}
              />
            ))}
          </Wrapper>
          {moviesToDisplay?.length === 0 && hideSeen && (
            <AllDone
              inCategory={Boolean(selectedCategory)}
              isPredictions={isLatestYear && predictions}
            />
          )}

          {seenMoviesList && seenMoviesList?.length > 0 && (
            <ProgressBar
              seenNr={seenMoviesList?.length}
              nrOfMovies={moviesList?.length}
            />
          )}
        </>
      </main>
    </>
  );
}
