import { FC } from "react";
import { DateTime } from "luxon";
import trophyImg from "../assets/images/oscar-statue.png";
import { Flex } from "@/styles/Flex";

const TROPHY_COLORS: { [key: number]: string } = {
  0: "#ffe448",
  1: "#b9b8b4",
  2: "#895d23",
};

interface Props {
  username: string;
  percentage: number;
  completed?: string | null;
  isCurrentUser: boolean;
  rank: number;
  seen?: number;
  isPending?: boolean;
}

export const LeaderboardItem: FC<Props> = ({
  username,
  percentage,
  completed,
  isCurrentUser,
  rank,
  seen,
  isPending = false,
}) => {
  return (
    <div key={username} className={`flex items-center justify-between px-4 py-2 odd:bg-neutral-200 first:bg-primary-500 first:text-neutral-0 ${isCurrentUser ? "!bg-ui-blue-lighter !text-neutral-1000" : ""}`}>
      <Flex $gap="sm" $alignItems="center">
        {rank < 3 && completed ? (
          <span className="inline-block h-[30px] w-[15px] bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]" style={{ backgroundColor: TROPHY_COLORS[rank] ?? "transparent", maskImage: `url(${trophyImg.src})`, WebkitMaskImage: `url(${trophyImg.src})`, WebkitMaskSize: "contain", WebkitMaskPosition: "center", WebkitMaskRepeat: "no-repeat" }} />
        ) : (
          <span className="min-w-[15px] text-center font-bold">{rank + 1}</span>
        )}
        <div style={{ wordBreak: "break-word" }}>{username}</div>
      </Flex>
      <div className="flex flex-col items-end gap-0 md:flex-row-reverse md:items-center md:gap-sm">
        {isPending ? (
          <span className="text-right text-[10px] md:text-xs">Pending invitation</span>
        ) : (
          <div className="whitespace-nowrap font-bold">
            {seen && <span style={{ fontWeight: 400 }}>{seen}, </span>}
            {percentage} %
          </div>
        )}
        {!isPending && completed && percentage == 100 && (
          <span className="text-right text-[10px] md:text-xs">
            Completed: <wbr />
            <em className="inline-block not-italic">{DateTime.fromISO(completed).toFormat("yyyy-MM-dd")}</em>
          </span>
        )}
      </div>
    </div>
  );
};
