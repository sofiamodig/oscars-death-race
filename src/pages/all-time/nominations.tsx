import { useEffect, useMemo, useState } from "react";
import { MovieCard } from "@/components/movieCard";
import { TextInput } from "@/components/textInput";
import { Toggle } from "@/components/toggle";
import { useAllTimeData } from "@/hooks/useAllTimeData";
import { InfoMessage } from "@/styles/Message";
import { Box } from "@/styles/Box";
import { AllTimeTabLayout } from "@/components/all-time/AllTimeTabLayout";
import { AllTimeLoading, LazyMovieCardWrapper, movieGridClasses } from "@/components/all-time/shared";

export const NominationsPage = () => {
  const { movies, allMovies, allMovieIds, allSeenMovies, allSeenMovieIds, isSignedIn, loading, error } = useAllTimeData();
  const [search, setSearch] = useState("");
  const [hideSeen, setHideSeen] = useState(false);

  const groups = useMemo(() => {
    const byCount = new Map<number, typeof allMovies>();
    allMovies.forEach((movie) => {
      const count = new Set((movie.categories ?? []).filter((category) => category !== "HONORARY AWARD" && !category.includes("SPECIAL ACHIEVEMENT"))).size;
      if (count < 2) return;
      const group = byCount.get(count) ?? [];
      group.push(movie);
      byCount.set(count, group);
    });
    return Array.from(byCount.entries()).sort(([a], [b]) => b - a).map(([count, nominatedMovies]) => ({
      count,
      movies: nominatedMovies.sort((a, b) => a.title.localeCompare(b.title)),
    }));
  }, [allMovies]);

  useEffect(() => {
    const stored = localStorage.getItem("hideSeen");
    if (stored !== null) setHideSeen(stored === "true");
  }, []);
  const toggleHideSeen = () => {
    const next = !hideSeen;
    setHideSeen(next);
    localStorage.setItem("hideSeen", String(next));
  };

  if (loading) return <AllTimeTabLayout tab="nominations"><AllTimeLoading /></AllTimeTabLayout>;
  if (error) return <AllTimeTabLayout tab="nominations"><InfoMessage>{error}</InfoMessage></AllTimeTabLayout>;

  return (
    <AllTimeTabLayout tab="nominations">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Box $marginBottom="8" $marginTop="6">
          <h1 className="heading text-3xl !mb-4">Movies by nominations</h1>
          {allSeenMovies.length > 0 && <p>You have seen {Math.round((allSeenMovies.length / allMovieIds.length) * 100)}% ({allSeenMovies.length}/{allMovieIds.length})</p>}
        </Box>
        <div className="w-full max-w-[300px]"><TextInput setValue={setSearch} value={search} type="text" placeholder="Search for title, director or cast" /></div>
      </div>

      {isSignedIn && <div className="mb-6"><Toggle label="Hide seen movies" value={hideSeen} onToggle={toggleHideSeen} /></div>}
      {groups.map(({ count, movies: nominatedMovies }) => {
        const allWereSeen = nominatedMovies.every((movie) => allSeenMovieIds.includes(movie.imdbId));
        if (allWereSeen && hideSeen) {
          return <div key={count} className="mb-6 border-b border-neutral-300 pb-6"><div className="flex flex-col items-center justify-center rounded-lg bg-[#e2cd7a] p-2 dark:bg-[#968242] dark:text-neutral-100"><h2 className="heading text-2xl">{count} nominations</h2>All done!</div></div>;
        }
        const visibleMovies = nominatedMovies.filter((movie) => {
          const matchesSearch = search.length <= 2 || movie.title.toLowerCase().includes(search.toLowerCase()) || movie.cast.toLowerCase().includes(search.toLowerCase()) || movie.director.toLowerCase().includes(search.toLowerCase());
          return matchesSearch && !(hideSeen && allSeenMovieIds.includes(movie.imdbId));
        });
        if (!visibleMovies.length) return null;
        return (
          <div key={count} className="mb-6 border-b border-neutral-300 pb-12">
            <div className="mb-6 flex justify-center rounded-lg bg-[#e2cd7a] p-2 dark:bg-[#968242] dark:text-neutral-100"><h2 className="heading text-2xl">{count} nominations</h2></div>
            <div className={movieGridClasses}>
              {visibleMovies.map((movie) => <LazyMovieCardWrapper key={movie.imdbId}><MovieCard data={movie} seenList={allSeenMovies} selectedYear={movie.year} movies={movies} /></LazyMovieCardWrapper>)}
            </div>
          </div>
        );
      })}
    </AllTimeTabLayout>
  );
};

export default NominationsPage;
