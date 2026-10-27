import React, { FC, useCallback, useContext, useEffect, useRef, useState } from "react";
import { SeenContext } from "@/contexts/seenContext";
import { MoviesYearsListType } from "@/types";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import { Line } from "react-chartjs-2";
import {
  fetchPublicUserSeenData,
} from "@/functions/fetchUsers";
import type { PublicUserSeenData } from "@/functions/fetchUsers";
import { TextInput } from "./textInput";

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
      <div className="w-full overflow-x-auto">
        <div className="h-[400px] min-w-[900px]">
          {/* @ts-ignore */}
          <Line options={options} data={data} />
        </div>
      </div>
      <div className="relative mt-xs max-w-[500px]">
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
          <div className="absolute inset-x-0 top-[calc(100%_+_4px)] z-10 max-h-[240px] overflow-y-auto rounded border border-neutral-200 bg-white shadow-[0_4px_12px_rgb(0_0_0_/_12%)]" role="listbox" aria-label="Username suggestions">
            {filteredUsernames.map((username) => (
              <button
                className="block w-full cursor-pointer border-0 bg-white px-4 py-2 text-left hover:bg-neutral-200 focus:bg-neutral-200 focus:outline-none"
                key={username}
                type="button"
                role="option"
                onClick={() => void selectUser(username)}
              >
                {username}
              </button>
            ))}
          </div>
        )}
        {isLoadingCompareUser && <p>Loading user data…</p>}
        {compareError && <p role="status">{compareError}</p>}
      </div>
    </>
  );
};

export default SeenLineChart;
