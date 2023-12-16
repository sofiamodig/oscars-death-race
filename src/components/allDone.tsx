import { FC } from "react";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
import oscarsStatue from "../assets/images/oscar-statue.png";
import Image from "next/image";
import { Flex } from "@/styles/Flex";

interface Props {
  inCategory?: boolean;
  isPredictions?: boolean;
}

export const AllDone: FC<Props> = ({ inCategory, isPredictions }) => {
  return (
    <Flex
      $justifyContent="center"
      $direction="column"
      $alignItems="center"
      $marginTop="xxl"
      $marginBottom="xxl"
    >
      <Image src={oscarsStatue} height={150} alt="" />
      <Heading size="lg" as="h2" marginTop="sm" marginBottom="xs">
        All done!
      </Heading>
      <Paragraph size="lg" textAlign="center">
        {inCategory
          ? "You have seen all the movies in this category."
          : isPredictions
          ? "You have seen all the predictions for this year."
          : "You have seen all the movies for this year."}
      </Paragraph>
    </Flex>
  );
};
