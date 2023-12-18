import { FC } from "react";
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
    height: 48px;
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
}

export const ProgressBar: FC<Props> = ({ nrOfMovies, seenNr = 0 }) => {
  if (!nrOfMovies) {
    return null;
  }

  const percentage = Math.floor((seenNr / nrOfMovies) * 100);

  return (
    <Wrapper>
      <Progress width={percentage}>
        {percentage > 5 && <Percentage>{percentage}%</Percentage>}
      </Progress>
      <Numbers></Numbers>
    </Wrapper>
  );
};
