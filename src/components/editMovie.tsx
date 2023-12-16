import React, { FC, useState } from "react";
import { useSnackbarContext } from "@/contexts/snackbarContext";
import { db } from "@/firebaseConfig";
import { Box } from "@/styles/Box";
import { Chip } from "@/styles/Chip";
import { CATEGORIES } from "@/utils";
import { doc, updateDoc } from "@firebase/firestore";
import { Button } from "./button";
import { Heading } from "./heading";
import { TextInput } from "./textInput";
import styled from "styled-components";

const Wrapper = styled.div`
  border-top: 1px solid var(--color-neutral-500);
  padding: 16px 0;
  margin-top: 16px;
`;

const ShowNoms = styled.button`
  all: unset;
  cursor: pointer;
  color: var(--color-ui-blue);
  font-size: 12px;
  font-weight: 600;
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

    const movieDoc = doc(db, "movie-collection", selectedYear, "movies", id);

    updateDoc(movieDoc, movieObj)
      .then(() => {
        setIsSubmitting(false);
        showSnackbar("Movie updated successfully", "success");
      })
      .catch((error) => {
        setIsSubmitting(false);
        showSnackbar(error.message, "error");
      });
  };

  return (
    <Wrapper>
      <Heading size="sm" as="h2">
        {title} <br />
        {(!showEdit || !showNominations) && (
          <ShowNoms
            onClick={() => {
              setShowNominations(true);
              setShowEdit(true);
            }}
          >
            Edit
          </ShowNoms>
        )}
      </Heading>

      <Form onSubmit={handleSubmit}>
        {showEdit && (
          <Box $marginTop="sm">
            <TextInput
              label="Poster URL"
              value={posterUrl}
              setValue={(value) => setPosterUrl(value)}
              placeholder="Poster URL"
            />
          </Box>
        )}

        {showNominations && (
          <Box $marginTop="sm">
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
        )}

        {(nominatedCategories.length > 0 || wonCategories.length > 0) && (
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
        <Box $marginTop="md" $width="100%">
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
      </Form>
    </Wrapper>
  );
};

export default EditMovie;
