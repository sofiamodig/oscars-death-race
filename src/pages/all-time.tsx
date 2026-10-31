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
import { useAuth } from "@/hooks/useAuth";
import { SeenContext } from "@/contexts/seenContext";
import { TextInput } from "@/components/textInput";
import { Box } from "@/styles/Box";

const movieGridClasses = "grid grid-cols-[repeat(auto-fill,minmax(440px,1fr))] gap-6 max-[450px]:grid-cols-1";

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
      <div className={movieGridClasses}>
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
      </div>
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
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
      </Head>
      <>
        <div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Box $marginBottom="8" $marginTop="6">
              <h1 className="heading text-3xl !mb-4">
                Nominations through the years
              </h1>
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
            <div className="w-full max-w-[300px]">
              <TextInput
                setValue={(value) => setSearch(value)}
                value={search}
                type="text"
                placeholder="Search for title, director or cast"
              />
            </div>
          </div>
          <div className="mb-6 flex flex-row flex-wrap items-center justify-start gap-2 md:[&>div:last-child]:ml-auto">
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
          </div>

          {search.length > 2 ? (
            <div className={movieGridClasses}>
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
            </div>
          ) : (
            <>
              {moviesToDisplay?.map((obj) => {
                const allWasSeen = obj.movies.every((movie) => {
                  return allSeenMoviesImdbIds?.includes(movie.imdbId);
                });

                if (allWasSeen && hideSeen) {
                  return (
                    <div key={obj.year} className="mb-6 border-b border-neutral-300 pb-6">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-amber-100 p-2 dark:bg-[#968242] dark:text-amber-100">
                        <h2 className="heading text-2xl">{obj.year}</h2>All done!
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={obj.year} className="mb-6 border-b border-neutral-300 pb-12">
                    <div className="mb-6 flex justify-center rounded-lg bg-amber-100 p-2 dark:bg-[#968242] dark:text-amber-100">
                      <h2 className="heading text-2xl">{obj.year}</h2>
                    </div>
                    <div className={movieGridClasses}>
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
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </>
    </>
  );
}
