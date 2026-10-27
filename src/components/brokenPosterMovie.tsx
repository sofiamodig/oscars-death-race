import { useState } from "react";
import { adminRequest } from "@/functions/adminRequest";
import { Button } from "./button";
import { Heading } from "./heading";
import { PosterPreview } from "./posterPreview";
import { TextInput } from "./textInput";

export interface PosterCandidate {
  posterUrl: string;
  title: string;
}

interface Props {
  id: string;
  title: string;
  currentPosterUrl: string;
  candidate?: PosterCandidate;
  onCandidate: (id: string, candidate: PosterCandidate) => void;
  disabled?: boolean;
}

export const BrokenPosterMovie = ({
  id,
  title,
  currentPosterUrl,
  candidate,
  onCandidate,
  disabled = false,
}: Props) => {
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const findPoster = async () => {
    setIsSearching(true);
    setErrorMessage("");
    try {
      const result = await adminRequest("/api/admin/movie-poster", "POST", {
        imdbId: id,
      });
      onCandidate(id, { posterUrl: result.posterUrl, title: result.title });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Poster search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mt-sm flex items-start gap-2.5 border-t border-neutral-500 py-sm sm:gap-sm">
      <PosterPreview url={candidate?.posterUrl ?? currentPosterUrl} title={title} />
      <div className="min-w-0 flex-1">
        <Heading size="sm" as="h2">{title}</Heading>
        <p className="my-xs text-sm">IMDb: {id}</p>
        {candidate && <p className="my-xs text-sm">OMDb match: {candidate.title || title}</p>}
        {candidate && (
          <TextInput
            label="Review or edit poster URL"
            value={candidate.posterUrl}
            setValue={(posterUrl) => onCandidate(id, { ...candidate, posterUrl })}
            disabled={disabled}
          />
        )}
        {errorMessage && <p className="my-xs text-sm" role="alert">{errorMessage}</p>}
        <Button
          type="button"
          label={candidate ? "Search again" : "Find poster"}
          onClick={findPoster}
          disabled={isSearching || disabled}
          variant="secondary"
          size="sm"
          isLoading={isSearching}
        />
      </div>
    </div>
  );
};
