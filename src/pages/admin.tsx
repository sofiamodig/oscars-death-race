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
import { adminRequest } from "@/functions/adminRequest";
import { BrokenPosterMovie } from "@/components/brokenPosterMovie";
import type { PosterCandidate } from "@/components/brokenPosterMovie";
import styled from "styled-components";

const BrokenPosterToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  cursor: pointer;
`;

const PosterSaveBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
`;

const PosterActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
`;

export const getStaticProps = (async () => {
  const movies = await fetchMovies();
  return { props: { movies }, revalidate: 60 };
}) satisfies GetStaticProps<{
  movies: MoviesYearsListType;
}>;

export default function Admin({
  movies,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { isAdmin } = useAuth();
  const [selectedYear, setSelectedYear] = useState<string>();
  const { yearsList } = getYearsList(movies);
  const [showBrokenPostersOnly, setShowBrokenPostersOnly] = useState(false);
  const [posterCandidates, setPosterCandidates] = useState<Record<string, PosterCandidate>>({});
  const [savedPosterUrls, setSavedPosterUrls] = useState<Record<string, string>>({});
  const [brokenPosterIds, setBrokenPosterIds] = useState<Set<string>>(() => new Set());
  const [posterScan, setPosterScan] = useState<{ year?: string; done: boolean }>({ done: false });
  const [isFindingAllPosters, setIsFindingAllPosters] = useState(false);
  const [findAllStatus, setFindAllStatus] = useState("");
  const [isSavingPosters, setIsSavingPosters] = useState(false);
  const [posterSaveStatus, setPosterSaveStatus] = useState("");
  const yearMovies = useMemo(() => {
    const selectedMovies = movies.find((movie) => movie.year === selectedYear)?.movies ?? [];
    return selectedMovies.map((movie) => ({
      ...movie,
      posterUrl: savedPosterUrls[`${selectedYear}:${movie.id}`] ?? movie.posterUrl,
    }));
  }, [movies, selectedYear, savedPosterUrls]);
  const brokenMovies = useMemo(
    () => yearMovies.filter((movie) => brokenPosterIds.has(movie.id)),
    [yearMovies, brokenPosterIds]
  );
  const stagedPosters = selectedYear
    ? Object.entries(posterCandidates).filter(([key]) => key.startsWith(`${selectedYear}:`))
    : [];
  const moviesWithoutCandidate = selectedYear
    ? brokenMovies.filter((movie) => !posterCandidates[`${selectedYear}:${movie.id}`])
    : [];
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    if (!selectedYear) {
      setSelectedYear(yearsList[0]?.value);
    }
  }, [yearsList, selectedYear]);

  useEffect(() => {
    setFindAllStatus("");
  }, [selectedYear]);

  useEffect(() => {
    if (!showBrokenPostersOnly || !selectedYear) {
      setBrokenPosterIds(new Set());
      setPosterScan({ done: false });
      return;
    }

    const moviesToCheck = yearMovies.filter((movie) => {
      const url = movie.posterUrl.trim();
      return url.length > 0 && url.toLowerCase() !== "n/a";
    });
    let cancelled = false;
    let nextIndex = 0;
    const activeImages = new Map<HTMLImageElement, (loaded: boolean) => void>();
    setBrokenPosterIds(new Set());
    setPosterScan({ year: selectedYear, done: false });

    const checkImage = (url: string) =>
      new Promise<boolean>((resolve) => {
        const image = new Image();
        const finish = (loaded: boolean) => {
          if (!activeImages.has(image)) return;
          activeImages.delete(image);
          image.onload = null;
          image.onerror = null;
          resolve(loaded);
        };
        activeImages.set(image, finish);
        image.onload = () => finish(true);
        image.onerror = () => finish(false);
        image.src = url;
      });

    const worker = async () => {
      while (!cancelled) {
        const index = nextIndex++;
        if (index >= moviesToCheck.length) return;
        const movie = moviesToCheck[index];
        const loaded = await checkImage(movie.posterUrl.trim());
        if (cancelled) return;
        if (!loaded) {
          setBrokenPosterIds((current) => new Set(current).add(movie.id));
        }
      }
    };

    const workerCount = Math.min(8, moviesToCheck.length);
    void Promise.all(Array.from({ length: workerCount }, worker)).then(() => {
      if (!cancelled) setPosterScan({ year: selectedYear, done: true });
    });

    return () => {
      cancelled = true;
      for (const [image, finish] of activeImages) {
        image.onload = null;
        image.onerror = null;
        finish(false);
      }
    };
  }, [showBrokenPostersOnly, selectedYear, yearMovies]);

  if (!isAdmin) {
    return <NotFound />;
  }

  const triggerDeploy = async () => {
    setStatus("Started deploy");
    try {
      await adminRequest("/api/admin/redeploy", "POST");
      setStatus("Deploying");
      setTimeout(() => {
        setStatus(undefined);
      }, 90000);
    } catch (error: any) {
      setStatus(undefined);
      window.alert(error.message);
    }
  };

  const stagePosterCandidate = (id: string, candidate: PosterCandidate) => {
    if (!selectedYear) return;
    const key = `${selectedYear}:${id}`;
    setPosterCandidates((current) => ({ ...current, [key]: candidate }));
    setPosterSaveStatus("");
  };

  const findPostersForAll = async () => {
    if (!selectedYear || moviesWithoutCandidate.length === 0) return;
    const year = selectedYear;
    const moviesToSearch = moviesWithoutCandidate;
    let nextIndex = 0;
    let foundCount = 0;
    let failedCount = 0;
    setIsFindingAllPosters(true);
    setFindAllStatus(`Searching 0 of ${moviesToSearch.length} posters…`);

    const worker = async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= moviesToSearch.length) return;
        const movie = moviesToSearch[index];
        try {
          const result = await adminRequest("/api/admin/movie-poster", "POST", {
            imdbId: movie.id,
          });
          setPosterCandidates((current) => ({
            ...current,
            [`${year}:${movie.id}`]: {
              posterUrl: result.posterUrl,
              title: result.title,
            },
          }));
          foundCount += 1;
        } catch {
          failedCount += 1;
        }
        setFindAllStatus(
          `Searching ${foundCount + failedCount} of ${moviesToSearch.length} posters…`
        );
      }
    };

    try {
      await Promise.all(
        Array.from({ length: Math.min(3, moviesToSearch.length) }, worker)
      );
      setFindAllStatus(
        `Found ${foundCount}; ${failedCount} could not be found. Review the results before saving.`
      );
    } finally {
      setIsFindingAllPosters(false);
    }
  };

  const savePosterCandidates = async () => {
    if (!selectedYear || stagedPosters.length === 0) return;
    setIsSavingPosters(true);
    setPosterSaveStatus("");
    let savedCount = 0;
    const savedUrls: Record<string, string> = {};

    try {
      for (const [key, candidate] of stagedPosters) {
        const imdbId = key.slice(selectedYear.length + 1);
        await adminRequest("/api/admin/movies", "PATCH", {
          year: Number(selectedYear),
          imdbId,
          posterUrl: candidate.posterUrl,
        });
        savedUrls[key] = candidate.posterUrl;
        savedCount += 1;
      }
      setPosterSaveStatus(`Saved ${savedCount} poster${savedCount === 1 ? "" : "s"}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save posters.";
      setPosterSaveStatus(`Saved ${savedCount}; stopped because: ${message}`);
    } finally {
      if (Object.keys(savedUrls).length > 0) {
        setSavedPosterUrls((current) => ({ ...current, ...savedUrls }));
        setPosterCandidates((current) => {
          const next = { ...current };
          Object.keys(savedUrls).forEach((key) => delete next[key]);
          return next;
        });
      }
      setIsSavingPosters(false);
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

      <BrokenPosterToggle>
        <input
          type="checkbox"
          checked={showBrokenPostersOnly}
          onChange={(event) => setShowBrokenPostersOnly(event.target.checked)}
        />
        Show only movies with broken poster URLs ({brokenMovies.length})
      </BrokenPosterToggle>

      {showBrokenPostersOnly && posterScan.year === selectedYear && !posterScan.done && (
        <Paragraph>Checking poster URLs for this year…</Paragraph>
      )}

      {showBrokenPostersOnly && posterScan.year === selectedYear && posterScan.done && (
        <PosterActions>
          <Button
            type="button"
            label={`Find posters for all (${moviesWithoutCandidate.length})`}
            onClick={findPostersForAll}
            disabled={isFindingAllPosters || isSavingPosters || moviesWithoutCandidate.length === 0}
            variant="secondary"
            size="md"
            isLoading={isFindingAllPosters}
          />
          {findAllStatus && <Paragraph>{findAllStatus}</Paragraph>}
        </PosterActions>
      )}

      {showBrokenPostersOnly && (stagedPosters.length > 0 || posterSaveStatus) && (
        <PosterSaveBar>
          {stagedPosters.length > 0 && (
            <Button
              type="button"
              label={`Save ${stagedPosters.length} reviewed poster${stagedPosters.length === 1 ? "" : "s"}`}
              onClick={savePosterCandidates}
              disabled={isSavingPosters || isFindingAllPosters}
              variant="primary"
              size="md"
              isLoading={isSavingPosters}
            />
          )}
          {posterSaveStatus && <Paragraph>{posterSaveStatus}</Paragraph>}
        </PosterSaveBar>
      )}

      <Box>
        {selectedYear && showBrokenPostersOnly
          ? brokenMovies.length > 0
            ? brokenMovies.map((movie) => (
                <BrokenPosterMovie
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  currentPosterUrl={movie.posterUrl}
                  candidate={posterCandidates[`${selectedYear}:${movie.id}`]}
                  onCandidate={stagePosterCandidate}
                  disabled={isSavingPosters || isFindingAllPosters}
                />
              ))
            : posterScan.year === selectedYear && posterScan.done
              ? <Paragraph>No broken poster URLs found for this year.</Paragraph>
              : null
          : selectedYear && yearMovies.map((movie) => (
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
