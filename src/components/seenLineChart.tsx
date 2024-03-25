import React, { FC, useContext } from "react";
import { SeenContext } from "@/contexts/seenContext";
import { MoviesYearsListType } from "@/types";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import { Line } from "react-chartjs-2";
import styled from "styled-components";

const InnerWrapper = styled.div`
  height: 400px;
  min-width: 500px;
`;

interface Props {
  movies: MoviesYearsListType;
}

const SeenLineChart: FC<Props> = ({ movies }) => {
  const { seenMovies } = useContext(SeenContext);
  const flattenedSeenMoviesImdbIds = seenMovies.flatMap((seenYear) =>
    seenYear.seenMovies?.map((movie) => movie.imdbId)
  );

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

  const labels = movies.map((yearlyMovies) => yearlyMovies.year);
  const seenPercentages = calculateSeenPercentage();

  const options = {
    responsive: true,
    layout: {
      padding: {
        top: 5,
      },
    },
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
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

  const data = {
    labels,
    datasets: [
      {
        label: "Seen Percentage",
        data: seenPercentages,
        borderColor: "#bb9c38",
        backgroundColor: "#bb9c38",
      },
    ],
  };

  return (
    <InnerWrapper>
      <Line options={options} data={data} />
    </InnerWrapper>
  );
};

export default SeenLineChart;
