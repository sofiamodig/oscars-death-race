import { FC } from "react";
import styled from "styled-components";
import { DateTime } from "luxon";
import trophyImg from "../assets/images/oscar-statue.png";
import { Flex } from "@/styles/Flex";

const TROPHY_COLORS: { [key: number]: string } = {
  0: "#ffe448",
  1: "#b9b8b4",
  2: "#895d23",
};

const TableItem = styled.div<{ $isCurrentUser: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;

  &:nth-child(2n + 1) {
    background-color: var(--color-neutral-200);
  }

  ${({ $isCurrentUser }) =>
    $isCurrentUser &&
    `
    background-color: var(--color-ui-blue-lighter) !important;
    color: var(--color-neutral-1000) !important;
  `}

  &:first-child {
    background-color: var(--color-primary-500);
    color: var(--color-neutral-0);
  }
`;

const Trophy = styled.div<{ color: string }>`
  display: inline-block;
  height: 30px;
  width: 15px;
  background-color: ${({ color }) => color};
  mask-image: url(${trophyImg.src});
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
  -webkit-mask-image: url(${trophyImg.src});
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
`;

const DateWrapper = styled.span`
  font-size: 10px;
  text-align: right;

  @media (min-width: 768px) {
    font-size: 12px;
  }
`;

const Date = styled.em`
  font-style: normal;
  display: inline-block;
`;

const Percentage = styled.div`
  font-weight: bold;
  white-space: nowrap;
`;

const Nr = styled.span`
  font-weight: bold;
  min-width: 15px;
  text-align: center;
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;

  @media (min-width: 768px) {
    flex-direction: row-reverse;
    gap: 16px;
    align-items: center;
  }
`;

interface Props {
  username: string;
  percentage: number;
  completed?: string | null;
  isCurrentUser: boolean;
  rank: number;
  seen?: number;
}

export const LeaderboardItem: FC<Props> = ({
  username,
  percentage,
  completed,
  isCurrentUser,
  rank,
  seen,
}) => {
  return (
    <TableItem key={username} $isCurrentUser={isCurrentUser}>
      <Flex $gap="sm" $alignItems="center">
        {rank < 3 && completed ? (
          <Trophy
            color={TROPHY_COLORS[rank] ? TROPHY_COLORS[rank] : "transparent"}
          />
        ) : (
          <Nr>{rank + 1}</Nr>
        )}
        <div style={{ wordBreak: "break-word" }}>{username}</div>
      </Flex>
      <RightCol>
        <Percentage>
          {seen && <span style={{ fontWeight: 400 }}>{seen}, </span>}
          {percentage} %
        </Percentage>
        {completed && percentage == 100 && (
          <DateWrapper>
            Completed: <wbr />
            <Date>{DateTime.fromISO(completed).toFormat("yyyy-MM-dd")}</Date>
          </DateWrapper>
        )}
      </RightCol>
    </TableItem>
  );
};
