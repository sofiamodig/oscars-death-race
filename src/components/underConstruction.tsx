import { Flex } from "@/styles/Flex";
import logo from "@/assets/images/oscarlogo.png";
import Image from "next/image";
import { FC } from "react";

interface Props {
  autoHeight?: boolean;
}

export const UnderConstruction: FC<Props> = ({ autoHeight }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${autoHeight ? "h-auto" : "h-screen"} [&_img]:h-auto [&_img]:w-[150px] [&_img]:aspect-[351/397]`}>
      <Flex $justifyContent="center" $direction="column" $gap="4">
        <Image src={logo} alt="logo" priority />
        <h1 className="heading text-3xl text-center">
          Under construction
        </h1>
        <p className="text-xl text-center">
          This page is currently under construction. Please check back later.
        </p>
      </Flex>
    </div>
  );
};
