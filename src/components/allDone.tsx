import { FC } from "react";
import oscarsStatue from "../assets/images/oscar-statue.png";
import Image from "next/image";
import { Flex } from "@/styles/Flex";

interface Props {
  inCategories?: number;
  isPredictions?: boolean;
}

export const AllDone: FC<Props> = ({ inCategories, isPredictions }) => {
  return (
    <Flex
      $justifyContent="center"
      $direction="column"
      $alignItems="center"
      $marginTop="12"
      $marginBottom="12"
    >
      <Image src={oscarsStatue} height={150} alt="Oscar statue" priority />
      <h2 className="heading text-2xl !mt-4 !mb-2">
        All done!
      </h2>
      <p className="text-xl text-center">
        {inCategories
          ? inCategories == 1
            ? "You have seen all the movies in this category."
            : "You have seen all the movies in these categories."
          : isPredictions
            ? "You have seen all the predictions for this year."
            : "You have seen all the movies for this year."}
      </p>
    </Flex>
  );
};
