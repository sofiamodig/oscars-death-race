import { FC, HTMLAttributes, useContext, useEffect, useState } from "react";

import { formatCategory, minutesToHours, sortCategories } from "../utils";

import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import statueImage from "../assets/images/oscar-statue.png";
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

const outerWrapperClass = "relative mb-sm flex h-full flex-col overflow-hidden rounded-lg";
const wrapperClass = "relative flex h-full flex-1 flex-row flex-wrap overflow-hidden bg-neutral-0 shadow-[0_0_20px_var(--color-neutral-300)] min-h-[250px] max-[450px]:min-h-0";
const contentClass = "flex flex-1 flex-col p-sm [&_p]:text-[13px] max-[450px]:[&_p]:text-xs [&_strong]:font-semibold";
export const Wrapper: FC<HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => <div className={`${wrapperClass} ${className}`} {...props} />;
export const Content: FC<HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => <div className={`${contentClass} ${className}`} {...props} />;

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
  const destination = userSettings.movieLinkDestination ?? "imdb";
  const movieLink = destination === "letterboxd" && data.letterboxdId
    ? { href: `https://letterboxd.com/film/${data.letterboxdId}/`, label: "GO TO LETTERBOXD" }
    : destination === "simkl" && data.simklId
      ? { href: `https://simkl.com/movies/${data.simklId}/`, label: "GO TO SIMKL" }
      : { href: `https://imdb.com/title/${data.imdbId}`, label: "GO TO IMDB" };

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
      <div className={outerWrapperClass}>
        <Wrapper>
          <button
            className={`absolute right-0 top-0 flex h-12 w-12 cursor-pointer flex-col items-center justify-center border-0 p-0 transition-colors duration-200 ${seen ? "bg-ui-green hover:bg-ui-light-green [&_svg]:fill-neutral-0" : "bg-neutral-300 hover:bg-neutral-400 [&_svg]:fill-neutral-700"} [&_span]:text-[9px] [&_span]:text-neutral-0`}
            type="button"
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
          </button>
          <div
            className="w-[37%] bg-cover bg-center"
            style={{
              backgroundImage: `url(${posterUrl.length > 0
                ? posterUrl
                : "https://www.oscarsdeathrace.com/no-poster.png"
                })`,
            }}
          />
          <Content>
            <div className="mb-sm">
              <h2 className="m-0 mb-0 pr-10 text-xl font-semibold max-[450px]:text-base [&_img]:mb-[-3px] [&_img]:mr-1">
                <div className="inline-block">
                  <div className="flex mr-1">

                    {data.wonCategories?.map((cat) => (
                      <Image
                        key={cat}
                        src={statueImage}
                        height={30}
                        alt="Oscars statue"
                      />
                    ))}
                  </div>
                </div>
                {data.title}
              </h2>
              {data.duration && <div className="text-[10px]">{minutesToHours(data.duration)}</div>}
            </div>
            <p>
              <strong>Director:</strong> {data.director}
            </p>
            <p>
              <strong>Cast:</strong> {data.cast}
            </p>

            {data.categories && data.categories?.length > 0 && (
              <p className="[&_em]:font-medium [&_em]:not-italic [&_em]:text-primary-500 [&_span:not(:last-child)]:after:content-[',_'] [&_em:not(:last-child)]:after:content-[',_']">
                <strong>Nominations:</strong>{" "}
                {sortedCategories.map((cat) => {
                  if (data.wonCategories?.includes(cat)) {
                    return <em key={cat}>{formatCategory(cat)}</em>;
                  } else {
                    return <span key={cat}>{formatCategory(cat)}</span>;
                  }
                })}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between pt-xs">
              {isSignedIn && (
                <button className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" onClick={() => setShowCommentModal(true)}>
                  <PenIcon />
                </button>
              )}
              <a
                className="mt-auto mr-[-4px] flex items-center self-end text-[13px] font-semibold tracking-[0.4px] text-secondary-500 transition-colors duration-200 hover:text-secondary-700 [&_svg]:fill-secondary-500 [&_svg]:transition-colors [&_svg]:duration-200 hover:[&_svg]:fill-secondary-700"
                href={movieLink.href}
                target="_BLANK"
              >
                <span>{movieLink.label}</span>
                <ChevronRightIcon />
              </a>
            </div>
          </Content>
        </Wrapper>
        {savedComment && <p className="m-0 w-full bg-[#bad4f6] px-1 py-0.5 text-xs">{savedComment.comment}</p>}
      </div>

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
          <input
            className="mb-sm w-full rounded border border-neutral-300 p-2 text-base"
            placeholder="Add a personal note"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex w-full justify-center gap-xs [&>button:last-child]:flex-1">
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
          </div>
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
