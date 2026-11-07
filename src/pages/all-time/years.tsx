import { useEffect, useMemo, useState } from "react";
import { MovieCard } from "@/components/movieCard";
import { TextInput } from "@/components/textInput";
import { Toggle } from "@/components/toggle";
import { useAllTimeData } from "@/hooks/useAllTimeData";
import { cleanupCategory } from "@/utils";
import { InfoMessage } from "@/styles/Message";
import { Box } from "@/styles/Box";
import { AllTimeTabLayout } from "@/components/all-time/AllTimeTabLayout";
import { AllTimeLoading, LazyMovieCardWrapper, movieGridClasses } from "@/components/all-time/shared";

const isShortMovie = (movie: { categories?: string[] }) =>
  movie.categories?.some((category) => category.toLowerCase().includes("short")) ?? false;

export const YearsPage = () => {
  const {
    movies, allMovies, moviesPerCategory, allMovieIds, allSeenMovies, allSeenMovieIds,
    categories, isSignedIn, loading, error,
  } = useAllTimeData();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("best-picture");
  const [onlyShowWinners, setOnlyShowWinners] = useState(false);
  const [hideSeen, setHideSeen] = useState(false);
  const [showShortMovies, setShowShortMovies] = useState(false);

  useEffect(() => {
    const savedHideSeen = localStorage.getItem("hideSeen");
    if (savedHideSeen !== null) setHideSeen(savedHideSeen === "true");
    const savedShorts = localStorage.getItem("showShortMovies");
    if (savedShorts !== null) setShowShortMovies(savedShorts === "true");
  }, []);

  const moviesToDisplay = useMemo(() => {
    if (selectedCategory === "all") return movies;
    return moviesPerCategory[selectedCategory] ?? [];
  }, [movies, moviesPerCategory, selectedCategory]);

  const toggleHideSeen = () => {
    const next = !hideSeen;
    setHideSeen(next);
    localStorage.setItem("hideSeen", String(next));
  };
  const toggleShortMovies = () => {
    const next = !showShortMovies;
    setShowShortMovies(next);
    localStorage.setItem("showShortMovies", String(next));
  };

  if (loading) return <AllTimeTabLayout tab="years"><AllTimeLoading /></AllTimeTabLayout>;
  if (error) return <AllTimeTabLayout tab="years"><InfoMessage>{error}</InfoMessage></AllTimeTabLayout>;

  return (
    <AllTimeTabLayout tab="years">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Box $marginBottom="8" $marginTop="6">
          <h1 className="heading text-3xl !mb-4">Nominations through the years</h1>
          {allSeenMovies.length > 0 && (
            <p>You have seen {Math.round((allSeenMovies.length / allMovieIds.length) * 100)}% ({allSeenMovies.length}/{allMovieIds.length})</p>
          )}
        </Box>
        <div className="w-full max-w-[300px]">
          <TextInput setValue={setSearch} value={search} type="text" placeholder="Search for title, director or cast" />
        </div>
      </div>

      <div className="mb-6 flex flex-row flex-wrap items-center justify-start gap-2 md:[&>div:last-child]:ml-auto">
        <div className="custom-select-wrapper" style={{ width: "230px" }}>
          <select onChange={(event) => setSelectedCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((category, index) => <option key={category.value} selected={index === 0} value={category.value}>{category.label}</option>)}
          </select>
        </div>
        <Toggle label="Only show winners" value={onlyShowWinners} onToggle={() => setOnlyShowWinners(!onlyShowWinners)} />
        {isSignedIn && <Toggle label="Hide seen movies" value={hideSeen} onToggle={toggleHideSeen} />}
        <Toggle label="Show short movies" value={showShortMovies} onToggle={toggleShortMovies} />
      </div>

      {search.length > 2 ? (
        <div className={movieGridClasses}>
          {allMovies.filter((movie) =>
            (showShortMovies || !isShortMovie(movie)) &&
            (movie.title.toLowerCase().includes(search.toLowerCase()) || movie.cast.toLowerCase().includes(search.toLowerCase()) || movie.director.toLowerCase().includes(search.toLowerCase()))
          ).map((movie) => (
            <LazyMovieCardWrapper key={movie.imdbId}>
              <MovieCard data={movie} seenList={allSeenMovies} selectedYear={movie.year} movies={movies} />
            </LazyMovieCardWrapper>
          ))}
        </div>
      ) : moviesToDisplay.map((yearGroup) => {
        const visibleMovies = yearGroup.movies.filter((movie) => showShortMovies || !isShortMovie(movie));
        if (!visibleMovies.length) return null;
        const allWereSeen = visibleMovies.every((movie) => allSeenMovieIds.includes(movie.imdbId));
        if (allWereSeen && hideSeen) {
          return <div key={yearGroup.year} className="mb-6 border-b border-neutral-300 pb-6"><div className="flex flex-col items-center justify-center rounded-lg bg-[#e2cd7a] p-2 dark:bg-[#968242] dark:text-neutral-100"><h2 className="heading text-2xl">{yearGroup.year}</h2>All done!</div></div>;
        }
        return (
          <div key={yearGroup.year} className="mb-6 border-b border-neutral-300 pb-12">
            <div className="mb-6 flex justify-center rounded-lg bg-[#e2cd7a] p-2 dark:bg-[#968242] dark:text-neutral-100"><h2 className="heading text-2xl">{yearGroup.year}</h2></div>
            <div className={movieGridClasses}>
              {visibleMovies.map((movie) => {
                const seen = allSeenMovieIds.includes(movie.imdbId);
                const isWinner = movie.wonCategories?.some((category) => cleanupCategory(category) === selectedCategory);
                if ((onlyShowWinners && !isWinner) || (hideSeen && seen)) return null;
                return <LazyMovieCardWrapper key={movie.imdbId}><MovieCard data={movie} seenList={allSeenMovies} selectedYear={yearGroup.year} movies={movies} /></LazyMovieCardWrapper>;
              })}
            </div>
          </div>
        );
      })}
    </AllTimeTabLayout>
  );
};

export default YearsPage;
