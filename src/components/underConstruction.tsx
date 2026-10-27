import { Flex } from "@/styles/Flex";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
import logo from "@/assets/images/oscarlogo.png";
import Image from "next/image";
import { FC } from "react";

interface Props {
  autoHeight?: boolean;
}

export const UnderConstruction: FC<Props> = ({ autoHeight }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-lg ${autoHeight ? "h-auto" : "h-screen"} [&_img]:h-auto [&_img]:w-[150px] [&_img]:aspect-[351/397]`}>
      <Flex $justifyContent="center" $direction="column" $gap="sm">
        <Image src={logo} alt="logo" priority />
        <Heading size="xxl" textAlign="center">
          Under construction
        </Heading>
        <Paragraph size="lg" textAlign="center">
          This page is currently under construction. Please check back later.
        </Paragraph>
      </Flex>
    </div>
  );
};
