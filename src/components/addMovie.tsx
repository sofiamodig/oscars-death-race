import React, { useState } from "react";
import { SearchIcon } from "@/assets/icons/SearchIcon";
import { useSnackbarContext } from "@/contexts/snackbarContext";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { Box } from "@/styles/Box";
import { Chip } from "@/styles/Chip";
import { CATEGORIES } from "@/utils";
import { doc, getDoc, setDoc, collection, addDoc } from "@firebase/firestore";
import { Button } from "./button";
import { TextInput } from "./textInput";
import styled from "styled-components";

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  input {
    padding-right: 40px;
  }

  button {
    background-color: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    display: flex;
    position: absolute;
    right: 2px;
    bottom: 12px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-flow: row wrap;
  gap: 8px;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ButtonWrapper = styled.div`
  width: 100%;
`;

const InitialErrors = {
  imdbId: "",
  title: "",
  posterUrl: "",
  director: "",
  cast: "",
  duration: "",
  year: "",
};

const InitialData = {
  imdbId: "",
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
      posterUrl: formData.posterUrl,
      categories: nominatedCategories,
      wonCategories: wonCategories,
    };

    const yearRef = doc(db, "movie-collection", formData.year);

    getDoc(yearRef)
      .then((docSnap) => {
        if (!docSnap.exists()) {
          // If the year doesn't exist, create it
          return setDoc(yearRef, { name: formData.year }).then(() => {
            const movieCollectionRef = collection(yearRef, "movies");

            return addDoc(movieCollectionRef, movieObj);
          });
        } else {
          // If the year exists, add the movie directly
          const movieCollectionRef = collection(yearRef, "movies");
          return addDoc(movieCollectionRef, movieObj);
        }
      })
      .then(() => {
        setFormData({
          ...InitialData,
          year: formData.year,
        });
        setIsSubmitting(false);
        showSnackbar("Movie added successfully", "success");
      })
      .catch((error) => {
        setIsSubmitting(false);
        showSnackbar(error.message, "error");
      });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {notFound && <p>{notFound}</p>}
      <SearchInputWrapper>
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
      </SearchInputWrapper>

      <SearchInputWrapper>
        <TextInput
          label="IMDB ID"
          placeholder="IMDB ID"
          type="text"
          errorMessage={errors.imdbId}
          value={formData.imdbId}
          setValue={(value: string) =>
            setFormData((prev) => ({ ...prev, imdbId: value }))
          }
          width="130px"
        />
        <button type="button" onClick={() => handleSearch()}>
          <SearchIcon />
        </button>
      </SearchInputWrapper>
      <TextInput
        label="Poster URL"
        placeholder="Poster URL"
        type="text"
        value={formData.posterUrl}
        errorMessage={errors.posterUrl}
        setValue={(value: string) =>
          setFormData((prev) => ({ ...prev, posterUrl: value }))
        }
        style={{ flex: 1 }}
      />
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
      <Box $marginTop="md">
        <p>Nominated Categories</p>
        <Chips>
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
        </Chips>
      </Box>

      {nominatedCategories.length > 0 && (
        <Box $marginTop="md">
          <p>Won Categories</p>
          <Chips>
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
          </Chips>
        </Box>
      )}
      <Box $marginTop="md">
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
    </Form>
  );
};

export default AddMovie;
