import { FC } from "react";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
import oscarsStatue from "../assets/images/oscar-statue.png";
import Image from "next/image";
import { Flex } from "@/styles/Flex";

export const AllDoneTiny = () => {
  return (
    <Flex
      $justifyContent="center"
      $direction="row"
      $alignItems="center"
      $marginTop="4"
      $marginBottom="4"
      $gap="4"
    >
      <Image src={oscarsStatue} height={50} alt="Oscar statue" priority />
      <Paragraph size="lg" textAlign="center">
        You have seen all!
      </Paragraph>
    </Flex>
  );
};
