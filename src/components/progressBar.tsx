import { SeenContext } from "@/contexts/seenContext";
import { Duration } from "luxon";
import { FC, useContext } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  background-color: #fff;
  width: 100%;
  height: 24px;
  left: 0;
  right: 0;
  box-shadow: 0 0 20px rgb(44 44 44 / 34%);

  @media all and (display-mode: standalone) {
    height: 40px;
  }
`;

const Progress = styled.div<{ width: number }>`
  height: 100%;
  width: 100%;
  background: linear-gradient(
    to right,
    rgb(156 200 156 / 33%) 0%,
    rgba(156, 200, 156, 1) 100%
  );
  width: ${(props) => props.width}%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  padding: 3px 0;
  box-sizing: border-box;
  color: #fff;
  font-size: 14px;
  transition: width 0.2s ease-in-out;

  @media all and (display-mode: standalone) {
    height: 48px;
    align-items: flex-start;
  }
`;

const Text = styled.div<{leftPosition: boolean}>`
  position: absolute;
  right: ${({leftPosition}) => leftPosition ? 'auto' : '8px'};
  left: ${({leftPosition}) => leftPosition ? '8px' : 'auto'};
  font-size: 12px;
  bottom: 4px;
  font-weight: bold;
`;

const Percentage = styled.div`
  padding: 4px 8px;

  @media all and (display-mode: standalone) {
    padding: 0 16px;
  }
`;

const Numbers = styled.div`
  position: absolute;
  right: 10px;
  bottom: 4px;
  font-size: 14px;
  font-weight: 600;
`;

interface Props {
  nrOfMovies?: number;
  seenNr?: number;
  seenTotalDuration?: number;
  moviesTotalDuration?: number;
}

export const ProgressBar: FC<Props> = ({ nrOfMovies, seenNr = 0, seenTotalDuration = 0, moviesTotalDuration = 0 }) => {
    const { userSettings } =
    useContext(SeenContext);
    
  if (!nrOfMovies) {
    return null;
  }
  
  const nrPercentage = Math.round((seenNr / nrOfMovies) * 100);
  const durationPercentage = Math.round((seenTotalDuration / moviesTotalDuration) * 100);

  const percentage = userSettings.percentageByWatchTime ? durationPercentage : nrPercentage;

  const remainingMinutes = Math.max(moviesTotalDuration - seenTotalDuration, 0);

  // Luxon Duration -> hours + minutes
  const dur = Duration.fromObject({ minutes: remainingMinutes })
    .shiftTo("hours", "minutes");

  // shiftTo can produce decimals in hours; ensure nice ints
  const hours = Math.floor(dur.hours);
  const minutes = Math.floor(dur.minutes);

  const remainingTimeText =
    hours > 0
      ? (minutes > 0 ? `${hours}h ${minutes}m left` : `${hours}h left`)
      : `${minutes}m left`;

  return (
    <Wrapper>
          <Text leftPosition={percentage > 60}>
            {userSettings.percentageByWatchTime
              ? remainingTimeText
              : `${nrOfMovies - seenNr} left to see`}
          </Text>
      <Progress width={percentage}>
        {percentage > 5 && <Percentage>{percentage}%</Percentage>}
      </Progress>
    </Wrapper>
  );
};
