import { FC } from "react";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
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
      $marginTop="xxl"
      $marginBottom="xxl"
    >
      <Image src={oscarsStatue} height={150} alt="Oscar statue" priority />
      <Heading size="lg" as="h2" marginTop="sm" marginBottom="xs">
        All done!
      </Heading>
      <Paragraph size="lg" textAlign="center">
        {inCategories
          ? inCategories == 1
            ? "You have seen all the movies in this category."
            : "You have seen all the movies in this categories."
          : isPredictions
          ? "You have seen all the predictions for this year."
          : "You have seen all the movies for this year."}
      </Paragraph>
    </Flex>
  );
};
