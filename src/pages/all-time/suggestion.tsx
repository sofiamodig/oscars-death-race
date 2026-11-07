import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { CheckIcon } from "@/assets/icons/CheckIcon";
import { ChevronRightIcon } from "@/assets/icons/ChevronRightIcon";
import { Modal } from "@/components/modal";
import { Toggle } from "@/components/toggle";
import { useAllTimeData } from "@/hooks/useAllTimeData";
import { AllTimeMovie } from "@/hooks/useAllTimeData";
import { cleanupCategory, formatCategory, prettifyCategory, sortCategories } from "@/utils";
import { InfoMessage } from "@/styles/Message";
import { AllTimeTabLayout } from "@/components/all-time/AllTimeTabLayout";
import { AllTimeLoading } from "@/components/all-time/shared";

type OmdbMovieInfo = {
  imdbRating?: string;
  imdbVotes?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Plot?: string;
  source?: "OMDb" | "Simkl";
  ratingSource?: "IMDb" | "Simkl";
  simklId?: number;
};

const isShortMovie = (movie: AllTimeMovie) =>
  movie.categories?.some((category) => category.toLowerCase().includes("short")) ?? false;

export const SuggestionPage = () => {
  const {
    movies, allMovies, allSeenMovieIds, isSignedIn, loading, error,
    addMovieToSeen, removeMovieFromSeen, userSettings,
  } = useAllTimeData();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoriesOptionsOpen, setCategoriesOptionsOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [yearSpan, setYearSpan] = useState<[number, number]>([0, 0]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AllTimeMovie>();
  const [suggestionInfo, setSuggestionInfo] = useState<OmdbMovieInfo>();
  const [suggestionInfoLoading, setSuggestionInfoLoading] = useState(false);
  const [suggestionInfoError, setSuggestionInfoError] = useState("");
  const [noSuggestionFound, setNoSuggestionFound] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [showShortMovies, setShowShortMovies] = useState(false);

  const yearOptions = useMemo(() => movies.map(({ year }) => Number(year)).sort((a, b) => a - b), [movies]);
  const selectedYearSpan: [number, number] = yearSpan[0] === 0 && yearOptions.length
    ? [yearOptions[0], yearOptions[yearOptions.length - 1]]
    : yearSpan;
  const yearRangeMin = yearOptions[0] ?? 0;
  const yearRangeMax = yearOptions[yearOptions.length - 1] ?? 0;
  const yearRangeWidth = Math.max(1, yearRangeMax - yearRangeMin);
  const yearRangeStartPercent = ((selectedYearSpan[0] - yearRangeMin) / yearRangeWidth) * 100;
  const yearRangeEndPercent = ((selectedYearSpan[1] - yearRangeMin) / yearRangeWidth) * 100;
  const categoryOptions = useMemo(() => {
    const categoryLabels = new Map<string, string>();
    const categoryCounts = new Map<string, number>();
    allMovies.forEach((movie) => {
      const year = Number(movie.year);
      const movieGenres = movie.genres?.map((genre) => genre.trim().toLocaleLowerCase()) ?? [];
      const matchesOtherFilters = year >= selectedYearSpan[0]
        && year <= selectedYearSpan[1]
        && (!selectedGenre || movieGenres.includes(selectedGenre))
        && (showShortMovies || (!isShortMovie(movie) && movie.duration !== undefined && movie.duration > 40));
      if (!matchesOtherFilters) return;

      new Set(movie.categories ?? []).forEach((category) => {
        const value = cleanupCategory(category);
        if (!value) return;
        categoryLabels.set(value, formatCategory(category) || prettifyCategory(value));
        categoryCounts.set(value, (categoryCounts.get(value) ?? 0) + 1);
      });
    });

    return sortCategories(Array.from(categoryLabels.keys()).filter((category) => (categoryCounts.get(category) ?? 0) >= 10))
      .map((value) => ({ value, label: categoryLabels.get(value) ?? prettifyCategory(value) }));
  }, [allMovies, selectedYearSpan[0], selectedYearSpan[1], selectedGenre, showShortMovies]);
  const genreOptions = useMemo(() => {
    const genreLabels = new Map<string, string>();
    const genreCounts = new Map<string, number>();
    allMovies.forEach((movie) => {
      const year = Number(movie.year);
      const matchesOtherFilters = year >= selectedYearSpan[0]
        && year <= selectedYearSpan[1]
        && (selectedCategories.length === 0 || movie.categories?.some((category) => selectedCategories.includes(cleanupCategory(category))))
        && (showShortMovies || (!isShortMovie(movie) && movie.duration !== undefined && movie.duration > 40));
      if (!matchesOtherFilters) return;

      new Set((movie.genres ?? []).map((genre) => genre.trim()).filter((genre) => genre && genre.toLocaleLowerCase() !== "erotica"))
        .forEach((genre) => {
          const value = genre.toLocaleLowerCase();
          genreLabels.set(value, genre);
          genreCounts.set(value, (genreCounts.get(value) ?? 0) + 1);
        });
    });
    return Array.from(genreLabels, ([value, label]) => ({ value, label, count: genreCounts.get(value) ?? 0 }))
      .filter((genre) => genre.count >= 5)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allMovies, selectedYearSpan[0], selectedYearSpan[1], selectedCategories, showShortMovies]);
  const suggestionIsSeen = Boolean(selectedSuggestion && allSeenMovieIds.includes(selectedSuggestion.imdbId));
  const destination = userSettings.movieLinkDestination ?? "imdb";
  const suggestionMovieLink = suggestionInfo?.source === "Simkl" && suggestionInfo.simklId
    ? { href: `https://simkl.com/movies/${suggestionInfo.simklId}/`, label: "GO TO SIMKL" }
    : destination === "letterboxd" && selectedSuggestion?.letterboxdId
      ? { href: `https://letterboxd.com/film/${selectedSuggestion.letterboxdId}/`, label: "GO TO LETTERBOXD" }
      : destination === "simkl" && selectedSuggestion?.simklId
        ? { href: `https://simkl.com/movies/${selectedSuggestion.simklId}/`, label: "GO TO SIMKL" }
        : { href: `https://imdb.com/title/${selectedSuggestion?.imdbId}`, label: "GO TO IMDB" };

  useEffect(() => {
    const saved = localStorage.getItem("showShortMovies");
    if (saved !== null) setShowShortMovies(saved === "true");
  }, []);
  useEffect(() => {
    if (yearOptions.length) setYearSpan([yearOptions[0], yearOptions[yearOptions.length - 1]]);
  }, [yearOptions]);
  useEffect(() => {
    setSelectedSuggestion(undefined);
    setSuggestionInfo(undefined);
    setNoSuggestionFound(false);
  }, [selectedCategories, selectedGenre, yearSpan[0], yearSpan[1]]);
  useEffect(() => {
    setSelectedCategories((current) => current.filter((category) => categoryOptions.some((option) => option.value === category)));
  }, [categoryOptions]);
  useEffect(() => {
    if (selectedGenre && !genreOptions.some((genre) => genre.value === selectedGenre)) setSelectedGenre("");
  }, [genreOptions, selectedGenre]);
  useEffect(() => {
    const imdbId = selectedSuggestion?.imdbId;
    if (!imdbId) {
      setSuggestionInfo(undefined);
      setSuggestionInfoError("");
      setSuggestionInfoLoading(false);
      return;
    }
    const controller = new AbortController();
    setSuggestionInfo(undefined);
    setSuggestionInfoError("");
    setSuggestionInfoLoading(true);
    fetch(`/api/movie-info?imdbId=${encodeURIComponent(imdbId)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Could not load movie details.");
        return result as OmdbMovieInfo;
      })
      .then(setSuggestionInfo)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        setSuggestionInfoError(fetchError instanceof Error ? fetchError.message : "Could not load movie details.");
      })
      .finally(() => { if (!controller.signal.aborted) setSuggestionInfoLoading(false); });
    return () => controller.abort();
  }, [selectedSuggestion?.imdbId]);

  const toggleShortMovies = () => {
    const next = !showShortMovies;
    setShowShortMovies(next);
    localStorage.setItem("showShortMovies", String(next));
  };
  const chooseSuggestion = () => {
    const unseen = allMovies.filter((movie) => {
      const year = Number(movie.year);
      const inYearSpan = year >= selectedYearSpan[0] && year <= selectedYearSpan[1];
      const inCategory = selectedCategories.length === 0 || movie.categories?.some((category) => selectedCategories.includes(cleanupCategory(category)));
      const movieGenres = movie.genres?.map((genre) => genre.trim().toLocaleLowerCase()) ?? [];
      const inGenre = !selectedGenre || movieGenres.includes(selectedGenre);
      const includesShort = showShortMovies || !isShortMovie(movie);
      const meetsRuntime = showShortMovies || (movie.duration !== undefined && movie.duration > 40);
      return inYearSpan && inCategory && inGenre && includesShort && meetsRuntime && !allSeenMovieIds.includes(movie.imdbId);
    });
    if (!unseen.length) {
      setSelectedSuggestion(undefined);
      setNoSuggestionFound(true);
      return;
    }
    const choices = unseen.length > 1 && selectedSuggestion
      ? unseen.filter((movie) => movie.imdbId !== selectedSuggestion.imdbId)
      : unseen;
    setSelectedSuggestion(choices[Math.floor(Math.random() * choices.length)]);
    setNoSuggestionFound(false);
  };

  if (loading) return <AllTimeTabLayout tab="suggestion"><AllTimeLoading /></AllTimeTabLayout>;
  if (error) return <AllTimeTabLayout tab="suggestion"><InfoMessage>{error}</InfoMessage></AllTimeTabLayout>;

  return (
    <AllTimeTabLayout tab="suggestion">
      <section>
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div
            className={`custom-multiselect ${categoriesOptionsOpen ? "open" : ""}`}
            style={{ width: "200px" }}
            tabIndex={0}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setCategoriesOptionsOpen(false);
            }}
          >
            <div
              className="custom-multiselect__control"
              onClick={() => setCategoriesOptionsOpen(!categoriesOptionsOpen)}
              onBlur={() => setCategoriesOptionsOpen(false)}
              title={selectedCategories.length
                ? sortCategories([...selectedCategories]).map((value) => categoryOptions.find((category) => category.value === value)?.label).filter(Boolean).join(", ")
                : "All categories"}
            >
              {selectedCategories.length
                ? sortCategories([...selectedCategories]).map((value) => categoryOptions.find((category) => category.value === value)?.label).filter(Boolean).join(", ")
                : "All categories"}
            </div>
            {categoriesOptionsOpen && (
              <div className="custom-multiselect__menu">
                {categoryOptions.map((category) => (
                  <label key={category.value} style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      value={category.value}
                      checked={selectedCategories.includes(category.value)}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedCategories((current) => current.includes(value)
                          ? current.filter((category) => category !== value)
                          : [...current, value]);
                      }}
                    />
                    {category.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="custom-select-wrapper" style={{ width: "200px" }}>
            <select aria-label="Genre" value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
              <option value="">All genres</option>
              {genreOptions.map((genre) => <option key={genre.value} value={genre.value}>{genre.label}</option>)}
            </select>
          </div>
          <Toggle label="Include shorts" value={showShortMovies} onToggle={toggleShortMovies} />
          <div className="md:flex gap-4 md:ml-auto w-full md:w-auto">
            <fieldset className="min-w-[280px] border-0 p-0 md:ml-auto">
              <div className="year-range-slider">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#b39930] dark:bg-[#968242]" style={{ left: `${yearRangeStartPercent}%`, width: `${Math.max(0, yearRangeEndPercent - yearRangeStartPercent)}%` }} />
                <input type="range" min={yearRangeMin} max={yearRangeMax} step="1" value={selectedYearSpan[0]} onChange={(event) => setYearSpan([Math.min(Number(event.target.value), selectedYearSpan[1]), selectedYearSpan[1]])} className="year-range-slider__input year-range-slider__input--start" aria-label="First year in suggestion range" />
                <input type="range" min={yearRangeMin} max={yearRangeMax} step="1" value={selectedYearSpan[1]} onChange={(event) => setYearSpan([selectedYearSpan[0], Math.max(Number(event.target.value), selectedYearSpan[0])])} className="year-range-slider__input year-range-slider__input--end" aria-label="Last year in suggestion range" />
              </div>
              <div className="mt-1 flex justify-between text-xs text-neutral-600 dark:text-neutral-300"><span>{selectedYearSpan[0]}</span><span>{selectedYearSpan[1]}</span></div>
            </fieldset>
          </div>
        </div>

        {!selectedSuggestion && (
          <div className="relative isolate mx-auto mt-8 flex min-h-[300px] max-w-5xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-[#b39930]/30 bg-gradient-to-br from-yellow-50 via-white to-yellow-100 px-6 py-12 text-center shadow-sm dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800">
            <div className="pointer-events-none absolute -left-12 -top-12 -z-10 h-44 w-44 rounded-full bg-[#e2cd7a]/30 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-16 -right-8 -z-10 h-48 w-48 rounded-full bg-[#b39930]/20 blur-3xl" aria-hidden="true" />
            <div className="mb-5 flex items-center gap-4 text-3xl" aria-hidden="true">
              <span className="animate-bounce [animation-delay:150ms] motion-reduce:animate-none">🎟️</span>
              <span className="text-5xl">🍿</span>
              <span className="animate-bounce [animation-delay:300ms] motion-reduce:animate-none">✨</span>
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#897b2c] dark:text-[#e2cd7a]">Random oscars movie</p>
            <h2 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">Your next movie night pick is waiting.</h2>
            <p className="mb-6 max-w-md text-sm text-neutral-600 dark:text-neutral-300">We&apos;ll find an unseen Oscar movie for your next movie night.</p>
            <Button label="🎲 Pick a movie" variant="primary" onClick={chooseSuggestion} isLoading={suggestionInfoLoading} disabled={suggestionInfoLoading} />
            {noSuggestionFound && <div className="mt-5"><InfoMessage>No unseen movies match the selected filters.</InfoMessage></div>}
          </div>
        )}

        {selectedSuggestion && (
          <section className="mx-auto max-w-5xl text-left mt-4 lg:mt-16">
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(220px,320px)_minmax(0,1fr)]">
              <div className="hidden lg:block relative mb-2 aspect-[2/3] w-full max-w-[320px] rounded-md bg-neutral-200 bg-cover bg-center shadow-xl dark:bg-neutral-700">
                <div className="absolute inset-0 rounded-md bg-cover bg-center" role="img" aria-label={`${selectedSuggestion.title} poster`} style={{ backgroundImage: `url(${selectedSuggestion.posterUrl && selectedSuggestion.posterUrl !== "N/A" ? selectedSuggestion.posterUrl : "https://www.oscarsdeathrace.com/no-poster.png"})` }} />
                <button className={`absolute right-0 top-0 flex h-12 w-12 cursor-pointer rounded-tr items-center justify-center border-0 p-0 transition-colors duration-200 ${suggestionIsSeen ? "bg-green-600 hover:bg-green-300 dark:hover:bg-green-700 [&_svg]:fill-white" : "bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500 [&_svg]:fill-neutral-700 dark:[&_svg]:fill-neutral-200"}`} type="button" aria-label={suggestionIsSeen ? "Mark as unseen" : "Mark as seen"} aria-pressed={suggestionIsSeen} onClick={() => {
                  if (!isSignedIn) setSignInModalOpen(true);
                  else if (suggestionIsSeen) removeMovieFromSeen(selectedSuggestion.imdbId, selectedSuggestion.year);
                  else addMovieToSeen(selectedSuggestion.imdbId, selectedSuggestion.year, movies);
                }}><CheckIcon /></button>
              </div>
              <div>
                <div className="flex gap-4">
                  <div className="aspect-[2/3] self-start w-[100px] shrink-0 lg:hidden rounded-md bg-cover bg-center bg-gray-600" role="img" aria-label={`${selectedSuggestion.title} poster`} style={{ backgroundImage: `url(${selectedSuggestion.posterUrl && selectedSuggestion.posterUrl !== "N/A" ? selectedSuggestion.posterUrl : "https://www.oscarsdeathrace.com/no-poster.png"})` }} />

                  <div>
                    <p className="mb-1 lg:mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#897b2c] dark:text-[#968242]">Oscars year {selectedSuggestion.year}</p>
                    <h2 className="heading text-2xl lg:text-4xl mb-1">{selectedSuggestion.title}</h2>

                    {suggestionInfoLoading ? <p className="mt-2 text-neutral-600 dark:text-neutral-300">Loading movie details…</p> : suggestionInfoError ? <p className="mb-5 text-neutral-600 dark:text-neutral-300" role="status">{suggestionInfoError}</p> : suggestionInfo ? <>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 text-lg">
                        <p className="flex items-center gap-1">
                          <svg className="h-6 w-6 shrink-0 fill-yellow-500" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.9 6.1 6.7.9-4.9 4.8 1.2 6.7-5.9-3.2-5.9 3.2 1.2-6.7-4.9-4.8 6.7-.9L12 2z" /></svg>
                          <strong className="text-lg lg:text-2xl">{suggestionInfo.imdbRating && suggestionInfo.imdbRating !== "N/A" ? `${suggestionInfo.imdbRating}` : "Not rated"}</strong>
                        </p>
                        {suggestionInfo.imdbVotes && suggestionInfo.imdbVotes !== "N/A" && <p className="text-sm text-neutral-600 dark:text-neutral-300">{suggestionInfo.imdbVotes} votes</p>}
                      </div>
                    </> : null}
                  </div>
                </div>
                {suggestionInfo?.Plot && suggestionInfo.Plot !== "N/A" && <p className="mt-2 mb-3 text-base leading-7">{suggestionInfo.Plot}</p>}

                <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    {suggestionInfo && (
                      <>
                        <dl className="grid max-w-lg grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left text-sm">
                          {[
                            { label: "Genre", value: suggestionInfo.Genre },
                            { label: "Released", value: suggestionInfo.Released },
                            { label: "Runtime", value: suggestionInfo.Runtime },
                            { label: "Rated", value: suggestionInfo.Rated },
                            { label: "Nominations", value: selectedSuggestion.categories?.length ? <span>{sortCategories([...selectedSuggestion.categories]).map((category, index) => <span key={category} className={selectedSuggestion.wonCategories?.includes(category) ? "font-medium text-[#b39930] dark:text-[#968242]" : undefined}>{formatCategory(category)}{index < selectedSuggestion.categories!.length - 1 ? ", " : ""}</span>)}</span> : "No nominations" },
                          ].map(({ label, value }) => value && value !== "N/A" ? <div className="contents" key={label}><dt className="font-semibold">{label}</dt><dd className="m-0 text-neutral-700 dark:text-neutral-200">{value}</dd></div> : null)}
                        </dl>
                        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">Movie details and {suggestionInfo.ratingSource ?? "IMDb"} rating provided by {suggestionInfo.source ?? "OMDb"}.</p>
                      </>
                    )}
                  </div>
                  <a className="mb-[-4px] flex shrink-0 items-center self-start text-[13px] font-semibold tracking-[0.4px] text-indigo-700 transition-colors duration-200 hover:text-indigo-900 [&_svg]:fill-indigo-700 dark:[&_svg]:fill-white [&_svg]:transition-colors [&_svg]:duration-200 hover:[&_svg]:fill-indigo-900 dark:hover:[&_svg]:fill-white dark:text-neutral-100 dark:hover:text-white dark:hover:underline md:self-end" href={suggestionMovieLink.href} target="_blank" rel="noreferrer"><span>{suggestionMovieLink.label}</span><ChevronRightIcon /></a>
                </div>
                <div className="mt-4"><Button label="🎲 Pick another movie" variant="primary" onClick={chooseSuggestion} isLoading={suggestionInfoLoading} disabled={suggestionInfoLoading} /></div>
              </div>
            </div>
          </section>
        )}
        <Modal isOpen={signInModalOpen} onClose={() => setSignInModalOpen(false)} maxWidth="400px">
          <h2 className="heading text-2xl !mb-4 text-center">You need to log in</h2>
          <p className="text-center">You need to sign in to add movies to your seen list. If you don&apos;t have an account you can create one.</p>
          <div className="mt-6"><div className="flex justify-center gap-4"><Button to="/signup" type="link" label="Sign up" variant="secondary" /><Button to="/login" type="link" label="Log in" /></div></div>
        </Modal>
      </section>
    </AllTimeTabLayout>
  );
};

export default SuggestionPage;
