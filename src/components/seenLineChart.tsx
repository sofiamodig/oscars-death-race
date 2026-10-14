import React, { FC, useCallback, useContext, useEffect, useRef, useState } from "react";
import { SeenContext } from "@/contexts/seenContext";
import { MoviesYearsListType } from "@/types";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import { Line } from "react-chartjs-2";
import styled from "styled-components";
import {
  fetchPublicUserSeenData,
} from "@/functions/fetchUsers";
import type { PublicUserSeenData } from "@/functions/fetchUsers";
import { TextInput } from "./textInput";

const InnerWrapper = styled.div`
  height: 400px;
  min-width: 900px;
`;

const ChartScrollArea = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const InputWrapper = styled.div`
  max-width: 500px;
  margin-top: 8px;
  position: relative;
`;

const Suggestions = styled.div`
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--color-neutral-200);
  border-radius: 4px;
  background: white;
  box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
`;

const Suggestion = styled.button`
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: 0;
  background: white;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus {
    background: var(--color-neutral-200);
    outline: none;
  }
`;

interface Props {
  movies: MoviesYearsListType;
  usernames: string[];
}

const SeenLineChart: FC<Props> = ({ movies, usernames }) => {
  const [userToCompareTo, setUserToCompareTo] = useState<string>("");
  const [compareUser, setCompareUser] = useState<PublicUserSeenData | null>(null);
  const [isLoadingCompareUser, setIsLoadingCompareUser] = useState(false);
  const [compareError, setCompareError] = useState("");
  const selectionRequestId = useRef(0);
  const { seenMovies } = useContext(SeenContext);
  const flattenedSeenMoviesImdbIds = seenMovies.flatMap((seenYear) =>
    seenYear.seenMovies?.map((movie) => movie.imdbId)
  );

  const selectUser = useCallback(async (username: string) => {
    const requestId = ++selectionRequestId.current;
    setUserToCompareTo(username);
    setCompareUser(null);
    setCompareError("");
    setIsLoadingCompareUser(true);
    try {
      const data = await fetchPublicUserSeenData(username);
      if (requestId !== selectionRequestId.current) return;
      setCompareUser(data);
      if (!data) setCompareError("No movie data found for this user.");
      else localStorage.setItem("userToCompareTo", data.username);
    } catch (error) {
      if (requestId !== selectionRequestId.current) return;
      setCompareError(
        error instanceof Error ? error.message : "Could not load this user.",
      );
    } finally {
      if (requestId === selectionRequestId.current) {
        setIsLoadingCompareUser(false);
      }
    }
  }, []);

  useEffect(() => {
    const savedUsername = localStorage.getItem("userToCompareTo");
    if (savedUsername && usernames.includes(savedUsername)) {
      void selectUser(savedUsername);
    }
  }, [selectUser, usernames]);

  const calculateSeenPercentage = () => {
    return movies.map((yearlyMovies) => {
      const totalMovies = yearlyMovies.movies.length;
      const seenThisYear = yearlyMovies.movies.filter((movie) =>
        flattenedSeenMoviesImdbIds.includes(movie.imdbId)
      ).length;
      const seenPercentage =
        totalMovies > 0 ? (seenThisYear / totalMovies) * 100 : 0;
      return Math.round(seenPercentage);
    });
  };

  function calculateUserSeenPercentage(user: PublicUserSeenData): number[] {
    const userSeenByYear = new Map(user.years.map((y) => [y.year, y.seen]));

    return movies.map(({ year, movies }) => {
      const totalMovies = movies.length;
      const seenThisYear = userSeenByYear.get(year) || 0; // Get seen count for the year, or 0 if not found
      const seenPercentage =
        totalMovies > 0 ? (seenThisYear / totalMovies) * 100 : 0;
      return Math.round(seenPercentage);
    });
  }

  const getNrOfMovies = (year: string, percentage: string) => {
    const findYear = movies.find((yearlyMovies) => yearlyMovies.year === year);
    if (!findYear) {
      return 0;
    }

    const parsedPercentage = Math.round(parseInt(percentage));
    const seenMovies = (parsedPercentage / 100) * findYear?.movies.length;
    return Math.round(seenMovies);
  };

  const labels = movies.map((yearlyMovies) => yearlyMovies.year);
  const seenPercentages = calculateSeenPercentage();
  const filteredUsernames = userToCompareTo.trim() && !compareUser && !isLoadingCompareUser
    ? usernames
        .filter((username) =>
          username.toLocaleLowerCase().includes(userToCompareTo.toLocaleLowerCase()),
        )
        .slice(0, 10)
    : [];
  const userToCompareToSeenPercentage = compareUser
    ? calculateUserSeenPercentage(compareUser)
    : [];

  const options = {
    responsive: true,
    layout: {
      padding: {
        top: 5,
      },
    },
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Your seen percentage by year",
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          title: (xDatapoint: any) => {
            return xDatapoint[0].label;
          },
          label: (yDatapoint: any) => {
            return (
              yDatapoint.dataset.label +
              ": " +
              getNrOfMovies(yDatapoint.label, yDatapoint.raw) +
              " (" +
              yDatapoint.formattedValue +
              "%)"
            );
          },
        },
      },
    },

    scales: {
      y: {
        display: false,
      },
      yAxis: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 10,
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
    },
  };

  let data = {
    labels,
    datasets: [
      {
        label: "You",
        data: seenPercentages,
        borderColor: "#bb9c38",
        backgroundColor: "#bb9c38",
      },
    ],
  };

  if (compareUser) {
    data.datasets.push({
      label: compareUser.username,
      data: userToCompareToSeenPercentage,
      borderColor: "#f5b65d",
      backgroundColor: "#f5b65d",
    });
  }

  return (
    <>
      <ChartScrollArea>
        <InnerWrapper>
          {/* @ts-ignore */}
          <Line options={options} data={data} />
        </InnerWrapper>
      </ChartScrollArea>
      <InputWrapper>
        <TextInput
          type="text"
          placeholder="Search username"
          value={userToCompareTo}
          label="Compare to user:"
          setValue={(value) => {
            selectionRequestId.current += 1;
            setUserToCompareTo(value);
            setCompareUser(null);
            setCompareError("");
            setIsLoadingCompareUser(false);
          }}
        />
        {filteredUsernames.length > 0 && (
          <Suggestions role="listbox" aria-label="Username suggestions">
            {filteredUsernames.map((username) => (
              <Suggestion
                key={username}
                type="button"
                role="option"
                onClick={() => void selectUser(username)}
              >
                {username}
              </Suggestion>
            ))}
          </Suggestions>
        )}
        {isLoadingCompareUser && <p>Loading user data…</p>}
        {compareError && <p role="status">{compareError}</p>}
      </InputWrapper>
    </>
  );
};

export default SeenLineChart;
