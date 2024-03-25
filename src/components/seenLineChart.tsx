import React, { FC, use, useContext, useEffect, useState } from "react";
import { SeenContext } from "@/contexts/seenContext";
import { MoviesYearsListType } from "@/types";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import { Line } from "react-chartjs-2";
import styled from "styled-components";
import {
  MaxUserType,
  getUserDataByUsername,
} from "@/functions/statisticsFunctions";
import { UsersType } from "@/pages/statistics";
import { TextInput } from "./textInput";

const InnerWrapper = styled.div`
  height: 400px;
  min-width: 800px;
`;

const InputWrapper = styled.div`
  max-width: 500px;
  margin-top: 8px;
`;

interface Props {
  movies: MoviesYearsListType;
  users: UsersType;
  bestUser: MaxUserType;
}

const SeenLineChart: FC<Props> = ({ movies, bestUser, users }) => {
  const [userToCompareTo, setUserToCompareTo] = useState<string>("");
  const { seenMovies } = useContext(SeenContext);
  const flattenedSeenMoviesImdbIds = seenMovies.flatMap((seenYear) =>
    seenYear.seenMovies?.map((movie) => movie.imdbId)
  );

  useEffect(() => {
    const localUserToCompareTo = localStorage.getItem("userToCompareTo");
    if (localUserToCompareTo) {
      setUserToCompareTo(localUserToCompareTo);
    }
  }, []);

  useEffect(() => {
    if (userToCompareTo.length > 0) {
      localStorage.setItem("userToCompareTo", userToCompareTo);
    }
  }, [userToCompareTo]);

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

  function calculateUserSeenPercentage(user: MaxUserType): number[] {
    const userSeenByYear = new Map(user.years.map((y) => [y.year, y.seen]));

    return movies.map(({ year, movies }) => {
      const totalMovies = movies.length;
      const seenThisYear = userSeenByYear.get(year) || 0; // Get seen count for the year, or 0 if not found
      const seenPercentage =
        totalMovies > 0 ? (seenThisYear / totalMovies) * 100 : 0;
      return Math.round(seenPercentage);
    });
  }

  const labels = movies.map((yearlyMovies) => yearlyMovies.year);
  const seenPercentages = calculateSeenPercentage();
  const bestUserSeenPercentage = calculateUserSeenPercentage(bestUser);
  const userToCompareData =
    userToCompareTo && getUserDataByUsername(userToCompareTo, users);
  const userToCompareToSeenPercentage = userToCompareData
    ? calculateUserSeenPercentage(userToCompareData)
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
      {
        label: bestUser.username + " (best user)",
        data: bestUserSeenPercentage,
        borderColor: "#3e95cd",
        backgroundColor: "#3e95cd",
      },
    ],
  };

  if (userToCompareData) {
    data.datasets.push({
      label: userToCompareData.username,
      data: userToCompareToSeenPercentage,
      borderColor: "#f5b65d",
      backgroundColor: "#f5b65d",
    });
  }

  return (
    <>
      <InnerWrapper>
        <Line options={options} data={data} />
      </InnerWrapper>
      <InputWrapper>
        <TextInput
          type="text"
          placeholder="Search username"
          value={userToCompareTo}
          label="Compare to user:"
          setValue={(value) => setUserToCompareTo(value)}
        />
      </InputWrapper>
    </>
  );
};

export default SeenLineChart;
