import Head from "next/head";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { fetchMovies } from "@/functions/fetchMovies";
import { MovieType, MoviesYearsListType } from "@/types";
import {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cleanupCategory, prettifyCategory, sortCategories } from "@/utils";
import { MovieCard } from "@/components/movieCard";
import { MovieCardSkeleton } from "@/components/movieCardSkeleton";
import { Toggle } from "@/components/toggle";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { SeenContext } from "@/contexts/seenContext";
import { Heading } from "@/components/heading";
import { TextInput } from "@/components/textInput";
import { Box } from "@/styles/Box";

const MovieGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
  gap: 24px;

  @media (max-width: 450px) {
    grid-template-columns: 1fr;
  }
`;

const TitleBox = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 16px;

  @media (min-width: 768px) {
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
  }
`;

const SearchWrapper = styled.div`
  width: 100%;
  max-width: 300px;
`;

const YearWrapper = styled.div<{ small?: boolean }>`
  padding-bottom: ${(small) => (small ? "24px" : "48px")};
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-neutral-300);
`;

const BarWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    & > div:last-child {
      margin-left: auto;
    }
  }
`;

const YearTitleWrapper = styled.div`
  background-color: #efe0af;
  padding: 8px;
  margin-bottom: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const AllDoneWrapper = styled.div`
  background-color: #efe0af;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

type ExtendedMovieType = MovieType & {
  year: string;
};

function transformData(moviesYearsList: MoviesYearsListType) {
  const categoriesMap: {
    [categoryName: string]: { year: string; movies: MovieType[] }[];
  } = {};

  // Iterate through each year and then each movie
  moviesYearsList.forEach((yearlyMovies) => {
    yearlyMovies.movies.forEach((movie) => {
      // A movie can belong to multiple categories
      movie.categories?.forEach((category) => {
        if (
          category === "HONORARY AWARD" ||
          category.includes("SPECIAL ACHIEVEMENT")
        ) {
          return;
        }
        const normalizedCategory = cleanupCategory(category);
        // Initialize the category array if it doesn't exist
        if (!categoriesMap[normalizedCategory]) {
          categoriesMap[normalizedCategory] = [];
        }

        // Check if the year already exists in the category
        let yearEntry = categoriesMap[normalizedCategory].find(
          (entry) => entry.year === yearlyMovies.year
        );

        if (!yearEntry) {
          // If the year doesn't exist, create a new entry
          yearEntry = { year: yearlyMovies.year, movies: [] };
          categoriesMap[normalizedCategory].push(yearEntry);
        }

        // Add the movie to the year entry
        yearEntry.movies.push(movie);
      });
    });
  });

  return categoriesMap;
}

type TransformedDataType = {
  [categoryName: string]: {
    year: string;
    movies: MovieType[];
  }[];
};

const LazyMovieCardWrapper = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ flex: 1 }} ref={ref}>
      {isVisible && children}
    </div>
  );
};

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  const transformedData = transformData([...movies].reverse());
  return {
    props: {
      movies: [...movies].reverse(),
      moviesPerCategory: transformedData,
    },
  };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
  moviesPerCategory: TransformedDataType;
}>;

export default function AllTime({
  movies,
  moviesPerCategory,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { isSignedIn } = useAuth();
  const { seenMovies, loading } = useContext(SeenContext);
  const [search, setSearch] = useState<string>("");
  const [onlyShowWinners, setOnlyShowWinners] = useState<boolean>(false);
  const [hideSeen, setHideSeen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("best-picture");

  const allMovies: ExtendedMovieType[] = useMemo(
    () =>
      movies.flatMap(({ year, movies }) =>
        movies.map((movie) => ({ ...movie, year }))
      ),
    [movies]
  );
  const allMoviesImdbIds = useMemo(
    () => allMovies.map((movie) => movie.imdbId),
    [allMovies]
  );
  const allSeenMovies = useMemo(
    () =>
      Array.from(new Set(seenMovies.flatMap((year) => year.seenMovies))).filter(
        (movie) => allMoviesImdbIds.includes(movie?.imdbId)
      ),
    [seenMovies, allMoviesImdbIds]
  );
  const allSeenMoviesImdbIds = useMemo(
    () => allSeenMovies.map((movie) => movie.imdbId),
    [allSeenMovies]
  );

  useEffect(() => {
    if (localStorage.getItem("hideSeen")) {
      setHideSeen(localStorage.getItem("hideSeen") === "true");
    }
  }, []);

  const moviesToDisplay = useMemo(() => {
    if (selectedCategory === "all") {
      return movies;
    }
    if (!moviesPerCategory[selectedCategory]) {
      return [];
    }

    if (!selectedCategory) {
      return [];
    }
    return moviesPerCategory[selectedCategory];
  }, [moviesPerCategory, selectedCategory, movies]);

  if (loading) {
    return (
      <MovieGrid>
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
      </MovieGrid>
    );
  }

  const toggleHideSeen = () => {
    setHideSeen(!hideSeen);
    localStorage.setItem("hideSeen", (!hideSeen).toString());
  };

  const categories = sortCategories(Object.keys(moviesPerCategory));

  const categoriesList = categories.map((category) => ({
    value: category,
    label: prettifyCategory(category),
  }));

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
      <>
        <div>
          <TitleBox>
            <Box $marginBottom="lg" $marginTop="md">
              <Heading size="xl" marginBottom="sm">
                Nominations through the years
              </Heading>
              {!loading && allSeenMovies.length ? (
                <p>
                  You have seen{" "}
                  {Math.round(
                    (allSeenMovies.length / allMoviesImdbIds.length) * 100
                  )}
                  % ({allSeenMovies.length}/{allMoviesImdbIds.length})
                </p>
              ) : null}
            </Box>
            <SearchWrapper>
              <TextInput
                setValue={(value) => setSearch(value)}
                value={search}
                type="text"
                placeholder="Search for title, director or cast"
              />
            </SearchWrapper>
          </TitleBox>
          <BarWrapper>
            <div className="custom-select-wrapper" style={{ width: "230px" }}>
              <select onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">All categories</option>
                {categoriesList.map((category, i) => (
                  <option
                    selected={i === 0}
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <Toggle
              label="Only show winners"
              value={onlyShowWinners}
              onToggle={() => setOnlyShowWinners(!onlyShowWinners)}
            />
            {isSignedIn && (
              <Toggle
                label="Hide seen movies"
                value={hideSeen}
                onToggle={toggleHideSeen}
              />
            )}
          </BarWrapper>

          {search.length > 2 ? (
            <MovieGrid>
              {allMovies
                .filter(
                  (movie) =>
                    movie.title.toLowerCase().includes(search.toLowerCase()) ||
                    movie.cast.toLowerCase().includes(search.toLowerCase()) ||
                    movie.director.toLowerCase().includes(search.toLowerCase())
                )
                .map((movie) => (
                  <LazyMovieCardWrapper key={movie.imdbId}>
                    <MovieCard
                      key={movie.imdbId}
                      data={movie}
                      seenList={allSeenMovies}
                      selectedYear={movie.year}
                      movies={movies}
                    />
                  </LazyMovieCardWrapper>
                ))}
            </MovieGrid>
          ) : (
            <>
              {moviesToDisplay?.map((obj) => {
                const allWasSeen = obj.movies.every((movie) => {
                  return allSeenMoviesImdbIds?.includes(movie.imdbId);
                });

                if (allWasSeen && hideSeen) {
                  return (
                    <YearWrapper key={obj.year} small>
                      <AllDoneWrapper>
                        <Heading size="lg">{obj.year}</Heading>All done!
                      </AllDoneWrapper>
                    </YearWrapper>
                  );
                }

                return (
                  <YearWrapper>
                    <YearTitleWrapper>
                      <Heading size="lg">{obj.year}</Heading>
                    </YearTitleWrapper>
                    <MovieGrid>
                      {obj.movies.map((movie) => {
                        const hasBeenSeen = allSeenMoviesImdbIds?.includes(
                          movie.imdbId
                        );

                        const isWinner = movie.wonCategories?.some(
                          (category) => {
                            return (
                              cleanupCategory(category) === selectedCategory
                            );
                          }
                        );

                        if (onlyShowWinners && !isWinner) {
                          return null;
                        }

                        if (hasBeenSeen && hideSeen) {
                          return null;
                        }

                        return (
                          <LazyMovieCardWrapper key={movie.imdbId}>
                            <MovieCard
                              key={movie.imdbId}
                              data={movie}
                              seenList={allSeenMovies ?? []}
                              selectedYear={obj.year}
                              movies={movies}
                            />
                          </LazyMovieCardWrapper>
                        );
                      })}
                    </MovieGrid>
                  </YearWrapper>
                );
              })}
            </>
          )}
        </div>
      </>
    </>
  );
}
