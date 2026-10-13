import { useState } from "react";
import styled from "styled-components";
import { adminRequest } from "@/functions/adminRequest";
import { Button } from "./button";
import { Heading } from "./heading";
import { PosterPreview } from "./posterPreview";
import { TextInput } from "./textInput";

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-top: 1px solid var(--color-neutral-500);
  padding: 16px 0;
  margin-top: 16px;

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const Details = styled.div`
  min-width: 0;
  flex: 1;
`;

const Result = styled.p`
  margin: 8px 0;
  font-size: 14px;
`;

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
    <Row>
      <PosterPreview url={candidate?.posterUrl ?? currentPosterUrl} title={title} />
      <Details>
        <Heading size="sm" as="h2">{title}</Heading>
        <Result>IMDb: {id}</Result>
        {candidate && <Result>OMDb match: {candidate.title || title}</Result>}
        {candidate && (
          <TextInput
            label="Review or edit poster URL"
            value={candidate.posterUrl}
            setValue={(posterUrl) => onCandidate(id, { ...candidate, posterUrl })}
            disabled={disabled}
          />
        )}
        {errorMessage && <Result role="alert">{errorMessage}</Result>}
        <Button
          type="button"
          label={candidate ? "Search again" : "Find poster"}
          onClick={findPoster}
          disabled={isSearching || disabled}
          variant="secondary"
          size="sm"
          isLoading={isSearching}
        />
      </Details>
    </Row>
  );
};
