import { useState } from "react";
import styled from "styled-components";

const Frame = styled.div`
  width: 112px;
  aspect-ratio: 2 / 3;
  flex: 0 0 112px;
  overflow: hidden;
  border: 1px solid var(--color-neutral-200);
  border-radius: 4px;
  background: var(--color-neutral-100);
  color: var(--color-neutral-500);
  display: grid;
  place-items: center;
  font-size: 12px;
  text-align: center;
`;

const Poster = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const PosterPreview = ({
  url,
  title,
}: {
  url: string;
  title: string;
}) => {
  const [failedUrl, setFailedUrl] = useState("");
  const imageUrl = url.trim();

  return (
    <Frame aria-label={`${title} poster preview`}>
      {imageUrl && failedUrl !== imageUrl ? (
        <Poster
          key={imageUrl}
          src={imageUrl}
          alt={`${title} poster`}
          loading="lazy"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <span>{imageUrl ? "Poster unavailable" : "No poster"}</span>
      )}
    </Frame>
  );
};
