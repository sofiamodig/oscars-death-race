import React, { FC, useState } from "react";
import { useSnackbarContext } from "@/contexts/snackbarContext";
import { Box } from "@/styles/Box";
import { Chip } from "@/styles/Chip";
import { CATEGORIES } from "@/utils";
import { adminRequest } from "@/functions/adminRequest";
import { Button } from "./button";
import { Heading } from "./heading";
import { TextInput } from "./textInput";
import { PosterPreview } from "./posterPreview";

interface Props {
  id: string;
  title: string;
  selectedYear: string;
  initialNominatedCategories: string[];
  initialWonCategories: string[];
  initialYear: string;
  initialPosterUrl: string;
}

const EditMovie: FC<Props> = ({
  id,
  title,
  selectedYear,
  initialNominatedCategories,
  initialWonCategories,
  initialYear,
  initialPosterUrl,
}) => {
  const [posterUrl, setPosterUrl] = useState(initialPosterUrl);
  const [showEdit, setShowEdit] = useState(false);
  const [nominatedCategories, setNominatedCategories] = useState<string[]>(
    initialNominatedCategories
  );
  const [wonCategories, setWonCategories] =
    useState<string[]>(initialWonCategories);
  const [showNominations, setShowNominations] = useState(
    nominatedCategories.length === 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSnackbar } = useSnackbarContext();

  const handleNominationClick = (category: string) => {
    if (nominatedCategories.includes(category)) {
      setNominatedCategories((prev) =>
        prev.filter((item) => item !== category)
      );
    } else {
      setNominatedCategories((prev) => [...prev, category]);
    }
  };

  const handleWonClick = (category: string) => {
    if (wonCategories.includes(category)) {
      setWonCategories((prev) => prev.filter((item) => item !== category));
    } else {
      setWonCategories((prev) => [...prev, category]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setIsSubmitting(true);

    const movieObj = {
      posterUrl,
      categories: nominatedCategories,
      wonCategories: wonCategories,
    };

    adminRequest("/api/admin/movies", "PATCH", {
      year: selectedYear,
      imdbId: id,
      ...movieObj,
    })
      .then(() => showSnackbar("Movie updated successfully", "success"))
      .catch((error) => showSnackbar(error.message, "error"))
      .finally(() => setIsSubmitting(false));
  };

  const handleRemove = async () => {
    setIsSubmitting(true);

    adminRequest("/api/admin/movies", "DELETE", {
      year: selectedYear,
      imdbId: id,
    })
      .then(() => showSnackbar("Movie removed successfully", "success"))
      .catch((error) => showSnackbar(error.message, "error"))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="mt-4 flex items-start gap-2.5 border-t border-neutral-500 py-4 sm:gap-4">
      <PosterPreview url={posterUrl} title={title} />
      <div className="min-w-0 flex-1">
        <Heading size="sm" as="h2">
          {title} <br />
          {(!showEdit || !showNominations) && (
            <button
              className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-blue-600"
              onClick={() => {
                setShowNominations(true);
                setShowEdit(true);
              }}
            >
              Edit
            </button>
          )}
        </Heading>

        <form onSubmit={handleSubmit} className="flex flex-row flex-wrap gap-2">
          {showEdit && (
            <Box $marginTop="4">
              <TextInput
                label="Poster URL"
                value={posterUrl}
                setValue={(value) => setPosterUrl(value)}
                placeholder="Poster URL"
              />
            </Box>
          )}

          {showEdit && (
            <Box $marginTop="4">
              <Button
                type="button"
                label="Remove"
                onClick={handleRemove}
                disabled={isSubmitting}
                variant="primary"
                size="md"
                isLoading={isSubmitting}
              />
            </Box>
          )}

          {showNominations && (
            <Box $marginTop="4">
              <p>Nominated Categories</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    type="button"
                    $isSelected={nominatedCategories.includes(category)}
                    onClick={() => handleNominationClick(category)}
                  >
                    {category.replace("Best", "")}
                  </Chip>
                ))}
              </div>
            </Box>
          )}

          {(nominatedCategories.length > 0 || wonCategories.length > 0) && (
            <Box $marginTop="6">
              <p>Won Categories</p>
              <div className="flex flex-wrap gap-2">
                {nominatedCategories.map((category) => (
                  <Chip
                    key={category}
                    type="button"
                    $isSelected={wonCategories.includes(category)}
                    onClick={() => handleWonClick(category)}
                  >
                    {category.replace("Best", "")}
                  </Chip>
                ))}
              </div>
            </Box>
          )}
          <Box $marginTop="6" $width="100%">
            <Button
              type="submit"
              label="Save"
              onClick={handleSubmit}
              disabled={isSubmitting}
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            />
          </Box>
        </form>
      </div>
    </div>
  );
};

export default EditMovie;
