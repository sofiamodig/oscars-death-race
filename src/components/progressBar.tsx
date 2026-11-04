import { SeenContext } from "@/contexts/seenContext";
import { Duration } from "luxon";
import { FC, useContext } from "react";

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
    <div className="fixed bottom-0 left-0 right-0 h-6 w-full bg-white shadow-[0_0_20px_rgb(44_44_44_/_34%)] dark:bg-neutral-700 dark:shadow-[0_0_20px_rgb(0_0_0_/_40%)] [@media(display-mode:standalone)]:h-10">
      <div className={`absolute bottom-1 text-xs font-bold ${percentage > 60 ? "left-2" : "right-2"}`}>
        {userSettings.percentageByWatchTime
          ? remainingTimeText
          : `${nrOfMovies - seenNr} left to see`}
      </div>
      <div style={{ width: `${percentage}%` }} className="flex h-full flex-row flex-nowrap items-center justify-end bg-[linear-gradient(to_right,rgb(156_200_156_/_33%)_0%,rgba(156,200,156,1)_100%)] py-[3px] text-sm text-white transition-[width] duration-200 [@media(display-mode:standalone)]:h-12 [@media(display-mode:standalone)]:items-start">
        {percentage > 5 && <div className="px-2 py-1 [@media(display-mode:standalone)]:px-4 [@media(display-mode:standalone)]:py-0">{percentage}%</div>}
      </div>
    </div>
  );
};
