import { FC, useContext, useEffect, useState } from "react";

import { formatCategory, minutesToHours, sortCategories } from "../utils";

import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import statueImage from "../assets/images/oscar-statue.png";
import styled from "styled-components";
import { SeenContext } from "@/contexts/seenContext";
import { useAuth } from "@/hooks/useAuth";
import { MovieType, MoviesYearsListType, SeenType } from "@/types";
import { DateTime } from "luxon";
import { CheckIcon } from "@/assets/icons/CheckIcon";
import { PenIcon } from "@/assets/icons/PenIcon";
import Image from "next/image";
import { ChevronRightIcon } from "@/assets/icons/ChevronRightIcon";
import { Modal } from "./modal";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Button } from "./button";
import { useCommentsContext } from "@/contexts/commentsContext";

const OuterWrapper = styled.div`
  margin-bottom: 16px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
`;

export const Wrapper = styled.div`
  border: 1px solid black;
  display: flex;
  flex-flow: row wrap;
  border: none;
  overflow: hidden;
  background-color: var(--color-neutral-0);
  box-shadow: 0 0 20px var(--color-neutral-300);
  min-height: 250px;
  position: relative;
  height: 100%;
  flex: 1;

  @media (max-width: 450px) {
    min-height: 0;
  }
`;

const ImageWrapper = styled.div`
  background-size: cover;
  background-position: center;
  width: 37%;
`;

export const Content = styled.div`
  flex: 1;
  padding: 16px;
  display: flex;
  flex-flow: column nowrap;

  p {
    font-size: 13px;

    @media (max-width: 450px) {
      font-size: 12px;
    }
  }

  strong {
    font-weight: 600;
  }
`;

const TitleWrapper = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 20px;
  margin-bottom: 0;
  font-weight: 600;
  padding-right: 40px;

  @media (max-width: 450px) {
    font-size: 16px;
  }

  img {
    margin-bottom: -3px;
    margin-right: 4px;
  }
`;

const MovieLink = styled.a`
  margin-top: auto;
  color: var(--color-secondary-500);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.4px;
  transition: color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  align-self: flex-end;
  margin-right: -4px;

  &:hover {
    color: var(--color-secondary-700);

    svg {
      fill: var(--color-secondary-700);
    }
  }

  svg {
    fill: var(--color-secondary-500);
    transition: fill 0.2s ease-in-out;
  }
`;

const Time = styled.div`
  font-size: 10px;
`;

const CheckButton = styled.button<{ $checked: boolean }>`
  border: none;
  background-color: ${({ $checked }) =>
    $checked ? "var(--color-ui-green)" : "var(--color-neutral-300)"};
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  right: 0;
  height: 48px;
  width: 48px;
  transition: background-color 0.2s ease-in-out;
  display: flex;
  flex-flow: column nowrap;

  &:hover {
    background-color: ${({ $checked }) =>
      $checked ? "var(--color-ui-light-green)" : "var(--color-neutral-400)"};
  }

  svg {
    fill: ${({ $checked }) =>
      $checked ? "var(--color-neutral-0)" : "var(--color-neutral-700)"};
  }

  span {
    font-size: 9px;
    color: var(--color-neutral-0);
  }
`;

const Nominations = styled.p`
  em {
    font-style: normal;
    font-weight: 500;
    color: var(--color-primary-500);
  }

  span:last-child:after,
  em:last-child:after {
    content: "";
  }

  span:after,
  em:after {
    content: ", ";
  }
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: auto;
  justify-content: space-between;
  padding-top: 8px;
`;

const Comment = styled.p`
  font-size: 12px;
  width: 100%;
  background: #bad4f6;
  padding: 2px 4px;
  margin: 0;
`;

const InputField = styled.input`
  border: 1px solid var(--color-neutral-300);
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  margin-bottom: 16px;
`;

const PenIconButton = styled.button`
  all: unset;
  width: 24px;
  height: 24px;
  cursor: pointer;
`;

const CommentButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  width: 100%;

  button:last-child {
    flex: 1;
  }
`;

interface Props {
  movies: MoviesYearsListType;
  data: MovieType;
  seenList: SeenType[];
  selectedYear: string;
}

export const MovieCard: FC<Props> = ({
  movies,
  data,
  seenList,
  selectedYear,
}) => {
  const { isSignedIn } = useAuth();
  const { comments, addComment, updateComment, deleteComment } =
    useCommentsContext();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { userSettings, addMovieToSeen, removeMovieFromSeen, changeSeenDate } =
    useContext(SeenContext);

  const savedComment = comments.find((c) => c.imdbId === data.imdbId);

  useEffect(() => {
    setNewComment(savedComment?.comment || "");
  }, [savedComment]);

  const [showCalendar, setShowCalendar] = useState(false);

  const seen = seenList.find((movie) => movie.imdbId === data.imdbId);
  const seenDate = seen?.date ? DateTime.fromISO(seen.date) : null;

  const onDateChange = (date?: string) => {
    if (!date) return;

    const formattedDate = DateTime.fromJSDate(new Date(date)).toString();

    changeSeenDate(data.imdbId, formattedDate, selectedYear);
    setShowCalendar(false);
  };

  const handleSeenClick = () => {
    if (!isSignedIn) {
      setSignInModalOpen(true);
      return;
    }

    if (seen && !userSettings.hideSeenDates) {
      setShowCalendar(true);
    } else if (seen) {
      removeMovieFromSeen(data.imdbId, selectedYear);
    } else {
      addMovieToSeen(data.imdbId, selectedYear, movies);
    }
  };

  const sortedCategories = data.categories
    ? sortCategories(data.categories)
    : [];

  const posterUrl =
    data.posterUrl && data.posterUrl !== "N/A" ? data.posterUrl : "";

  return (
    <>
      <OuterWrapper>
        <Wrapper>
          <CheckButton
            type="button"
            $checked={Boolean(seen)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSeenClick();
            }}
          >
            <CheckIcon />
            {seenDate && !userSettings.hideSeenDates && (
              <span>{seenDate.toFormat("dd/MM-yy")}</span>
            )}
          </CheckButton>
          <ImageWrapper
            style={{
              backgroundImage: `url(${
                posterUrl.length > 0
                  ? posterUrl
                  : "https://www.oscarsdeathrace.com/no-poster.png"
              })`,
            }}
          />
          <Content>
            <TitleWrapper>
              <Title>
                {data.wonCategories?.map((cat) => (
                  <Image
                    key={cat}
                    src={statueImage}
                    height={30}
                    alt="Oscars statue"
                  />
                ))}
                {data.title}
              </Title>
              {data.duration && <Time>{minutesToHours(data.duration)}</Time>}
            </TitleWrapper>
            <p>
              <strong>Director:</strong> {data.director}
            </p>
            <p>
              <strong>Cast:</strong> {data.cast}
            </p>

            {data.categories && data.categories?.length > 0 && (
              <Nominations>
                <strong>Nominations:</strong>{" "}
                {sortedCategories.map((cat) => {
                  if (data.wonCategories?.includes(cat)) {
                    return <em key={cat}>{formatCategory(cat)}</em>;
                  } else {
                    return <span key={cat}>{formatCategory(cat)}</span>;
                  }
                })}
              </Nominations>
            )}
            <BottomRow>
              {isSignedIn && (
                <PenIconButton onClick={() => setShowCommentModal(true)}>
                  <PenIcon />
                </PenIconButton>
              )}
              <MovieLink
                href={`https://imdb.com/title/${data.imdbId}`}
                target="_BLANK"
              >
                <span>GO TO IMDB</span>
                <ChevronRightIcon />
              </MovieLink>
            </BottomRow>
          </Content>
        </Wrapper>
        {savedComment && <Comment>{savedComment.comment}</Comment>}
      </OuterWrapper>

      <Modal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        maxWidth="400px"
      >
        <Heading size="lg" as="h2" marginBottom="sm" textAlign="center">
          You need to log in
        </Heading>
        <Paragraph textAlign="center">
          You need to sign in to add movies to your seen list. If you don&apos;t
          have an account you can create one for.
        </Paragraph>
        <Box $marginTop="md">
          <Flex $gap="sm" $justifyContent="center">
            <Button
              to="/signup"
              type="link"
              label="Sign up"
              variant="secondary"
            />
            <Button to="/login" type="link" label="Log in" />
          </Flex>
        </Box>
      </Modal>

      <Modal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        maxWidth="400px"
      >
        <Flex $direction="column" $justifyContent="center" $gap="sm">
          <InputField
            placeholder="Add a personal note"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <CommentButtons>
            {savedComment && (
              <Button
                label="Remove"
                size="md"
                variant="danger"
                onClick={() => {
                  deleteComment(savedComment.imdbId);
                  setShowCommentModal(false);
                }}
              />
            )}
            <Button
              label="Save comment"
              size="md"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (savedComment) {
                  updateComment({
                    ...savedComment,
                    comment: newComment,
                  });
                } else {
                  addComment({
                    imdbId: data.imdbId,
                    comment: newComment,
                  });
                }

                setShowCommentModal(false);
              }}
            />
          </CommentButtons>
        </Flex>
      </Modal>

      <Modal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        maxWidth="400px"
      >
        <Flex $direction="column" $justifyContent="center" $gap="sm">
          <Calendar
            value={seenDate?.toISODate()}
            onChange={(value) => onDateChange(value?.toString())}
            maxDate={new Date()}
          />
          <Button
            label="Remove seen"
            size="sm"
            variant="danger"
            onClick={() => {
              removeMovieFromSeen(data.imdbId, selectedYear);
              setShowCalendar(false);
            }}
          />
        </Flex>
      </Modal>
    </>
  );
};
