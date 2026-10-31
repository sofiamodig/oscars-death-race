import { useState } from "react";

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
    <div aria-label={`${title} poster preview`} className="grid aspect-[2/3] w-28 flex-[0_0_112px] place-items-center overflow-hidden rounded border border-neutral-200 bg-neutral-100 text-center text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-400">
      {imageUrl && failedUrl !== imageUrl ? (
        <img
          className="block h-full w-full object-cover"
          key={imageUrl}
          src={imageUrl}
          alt={`${title} poster`}
          loading="lazy"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <span>{imageUrl ? "Poster unavailable" : "No poster"}</span>
      )}
    </div>
  );
};
