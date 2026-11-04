import React, { useState } from "react";
import { SearchIcon } from "@/assets/icons/SearchIcon";
import { useSnackbarContext } from "@/contexts/snackbarContext";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { Chip } from "@/styles/Chip";
import { CATEGORIES } from "@/utils";
import { adminRequest } from "@/functions/adminRequest";
import { Button } from "./button";
import { TextInput } from "./textInput";
import { PosterPreview } from "./posterPreview";

const InitialErrors = {
  imdbId: "",
  tmdbId: "",
  letterboxdId: "",
  simklId: "",
  title: "",
  posterUrl: "",
  director: "",
  cast: "",
  duration: "",
  year: "",
};

const InitialData = {
  imdbId: "",
  tmdbId: "",
  letterboxdId: "",
  simklId: "",
  title: "",
  posterUrl: "",
  director: "",
  cast: "",
  duration: 0,
  year: "",
};

const AddMovie = () => {
  const [formData, setFormData] = useState(InitialData);
  const [nominatedCategories, setNominatedCategories] = useState<string[]>([]);
  const [wonCategories, setWonCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState(InitialErrors);
  const [notFound, setNotFound] = useState("");
  const { isAdmin } = useAuth();
  const { showSnackbar } = useSnackbarContext();

  const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY;

  if (!isAdmin) return null;

  const lookupSimkl = async (imdbId: string) => {
    if (!/^tt\d+$/.test(imdbId)) return;
    setNotFound("");
    try {
      const result = await adminRequest("/api/admin/movie-lookup", "POST", { imdbId });
      setFormData((previous) => ({
        ...previous,
        tmdbId: previous.tmdbId || result.tmdbId || "",
        letterboxdId: previous.letterboxdId || result.letterboxdId || "",
        simklId: previous.simklId || (result.simklId ? String(result.simklId) : ""),
      }));
      if (result.warnings?.length) {
        setNotFound(result.warnings.join(" "));
      } else if (!result.simklId && !result.tmdbId && !result.letterboxdId) {
        setNotFound("Simkl returned no external IDs for this IMDb ID.");
      }
    } catch (error) {
      setNotFound(error instanceof Error ? error.message : "Simkl lookup failed.");
    }
  };

  const handleSearch = async (isTitle?: boolean) => {
    setNotFound("");
    let apiURL =
      "https://www.omdbapi.com/?i=" + formData.imdbId + `&apikey=${apiKey}`;

    if (formData.title && isTitle) {
      const formatTitle = formData.title.toLowerCase().replace(/ /g, "_");
      apiURL = "https://www.omdbapi.com/?t=" + formatTitle + "&apikey=90e46764";
    }

    fetch(apiURL)
      .then((response) => response.json())
      .then((data) => {
        if (data.Error) {
          setNotFound("Could not find the movie, try again");
        } else {
          setErrors(InitialErrors);
          if (isTitle) void lookupSimkl(data.imdbID);
          setFormData((prevState) => ({
            ...prevState,
            imdbId: data.imdbID,
            title: data.Title,
            posterUrl: data.Poster,
            director: data.Director,
            cast: data.Actors,
            duration: parseInt(data.Runtime) ?? null,
          }));
        }
      });
  };

  const validate = () => {
    const errors = InitialErrors;
    let isValid = true;

    if (formData.imdbId.length === 0) {
      errors.imdbId = "IMDB ID is required";
      isValid = false;
    }

    if (formData.title.length === 0) {
      errors.title = "Title is required";
      isValid = false;
    }

    if (formData.posterUrl.length === 0) {
      errors.posterUrl = "Poster URL is required";
      isValid = false;
    }

    if (formData.director.length === 0) {
      errors.director = "Director is required";
      isValid = false;
    }

    if (formData.cast.length === 0) {
      errors.cast = "Cast is required";
      isValid = false;
    }

    if (formData.duration === 0) {
      errors.duration = "Duration is required";
      isValid = false;
    }

    if (formData.year.length === 0) {
      errors.year = "Year is required";
      isValid = false;
    }

    setErrors(errors);

    return isValid;
  };

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

    if (!validate()) return;
    setIsSubmitting(true);
    setErrors(InitialErrors);

    const movieObj = {
      title: formData.title,
      cast: formData.cast,
      director: formData.director,
      duration: formData.duration,
      imdbId: formData.imdbId,
      tmdbId: formData.tmdbId,
      letterboxdId: formData.letterboxdId,
      simklId: formData.simklId,
      posterUrl: formData.posterUrl,
      categories: nominatedCategories,
      wonCategories: wonCategories,
    };

    try {
      const result = await adminRequest("/api/admin/movies", "POST", {
        ...movieObj,
        year: formData.year,
      });
      setFormData({ ...InitialData, year: formData.year });
      const idSummary = `TMDb: ${result.tmdbId ?? "not found"}; Letterboxd: ${result.letterboxdId ?? "not found"}; Simkl: ${result.simklId ?? "not found"}.`;
      showSnackbar(
        result.warnings?.length
          ? `Movie added. ${idSummary} ${result.warnings.join(" ")}`
          : `Movie added successfully. ${idSummary}`,
        result.warnings?.length ? "info" : "success"
      );
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {notFound && <p>{notFound}</p>}
      <form onSubmit={handleSubmit} className="flex flex-row flex-wrap gap-2">
        <TextInput
          label="Year"
          placeholder="Year"
          type="text"
          value={formData.year}
          errorMessage={errors.year}
          setValue={(value: string) =>
            setFormData((prev) => ({ ...prev, year: value }))
          }
          width="68px"
        />
        <div className="flex w-full flex-wrap gap-2">
          <div className="relative flex items-center justify-between [&_input]:pr-10 [&_button]:absolute [&_button]:right-0.5 [&_button]:bottom-3 [&_button]:flex [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:outline-none">
            <TextInput
              label="Title"
              placeholder="Title"
              type="text"
              value={formData.title}
              errorMessage={errors.title}
              setValue={(value: string) =>
                setFormData((prev) => ({ ...prev, title: value }))
              }
            />
            <button type="button" onClick={() => handleSearch(true)}>
              <SearchIcon />
            </button>
          </div>
          <div className="relative flex items-center justify-between [&_input]:pr-10 [&_button]:absolute [&_button]:right-0.5 [&_button]:bottom-3 [&_button]:flex [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:outline-none">
            <TextInput
              label="IMDB ID"
              placeholder="IMDB ID"
              type="text"
              errorMessage={errors.imdbId}
              value={formData.imdbId}
              onBlur={() => void lookupSimkl(formData.imdbId)}
              setValue={(value: string) =>
                setFormData((prev) => ({ ...prev, imdbId: value }))
              }
              width="130px"
            />
            <button type="button" onClick={() => handleSearch()}>
              <SearchIcon />
            </button>
          </div>
          <TextInput label="TMDb ID" placeholder="TMDb ID" type="text" value={formData.tmdbId} setValue={(value: string) => setFormData((prev) => ({ ...prev, tmdbId: value }))} width="120px" />
          <TextInput label="Letterboxd ID" placeholder="Letterboxd ID" type="text" value={formData.letterboxdId} setValue={(value: string) => setFormData((prev) => ({ ...prev, letterboxdId: value }))} width="140px" />
          <TextInput label="Simkl ID" placeholder="Simkl ID" type="text" value={formData.simklId} setValue={(value: string) => setFormData((prev) => ({ ...prev, simklId: value }))} width="120px" />
        </div>

        <TextInput
          label="Director"
          placeholder="Director"
          type="text"
          value={formData.director}
          errorMessage={errors.director}
          setValue={(value: string) =>
            setFormData((prev) => ({ ...prev, director: value }))
          }
          width="160px"
        />
        <TextInput
          label="Cast"
          placeholder="Cast"
          type="text"
          value={formData.cast}
          errorMessage={errors.cast}
          setValue={(value: string) =>
            setFormData((prev) => ({ ...prev, cast: value }))
          }
          style={{ flex: 1 }}
        />
        <TextInput
          label="Duration"
          placeholder="Duration"
          type="number"
          value={formData.duration.toString()}
          errorMessage={errors.duration}
          setValue={(value: string) =>
            setFormData((prev) => ({ ...prev, duration: parseInt(value) }))
          }
          width="82px"
        />
        <div className="flex flex-[1_0_100%] items-start gap-3 [&>div:nth-child(2)]:min-w-0 [&>div:nth-child(2)]:flex-1">
          <PosterPreview
            url={formData.posterUrl}
            title={formData.title || "Movie"}
          />
          <TextInput
            label="Poster URL"
            placeholder="Poster URL"
            type="text"
            value={formData.posterUrl}
            errorMessage={errors.posterUrl}
            setValue={(value: string) =>
              setFormData((prev) => ({ ...prev, posterUrl: value }))
            }
          />
        </div>
        <Box $marginTop="6">
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

        {nominatedCategories.length > 0 && (
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
        <Box $marginTop="6">
          <Button
            type="submit"
            label="Add movie"
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          />
        </Box>
      </form>
    </>
  );
};

export default AddMovie;
