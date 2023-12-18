import { Flex } from "@/styles/Flex";
import { Heading } from "./heading";
import { Paragraph } from "./paragraph";
import logo from "@/assets/images/oscarlogo.png";
import styled from "styled-components";
import Image from "next/image";
import { FC } from "react";

const Wrapper = styled.div<{ $autoHeight?: boolean }>`
  height: ${({ $autoHeight }) => ($autoHeight ? "auto" : "100vh")};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 32px;

  img {
    width: 150px;
    aspect-ratio: 351 / 397;
    height: auto;
  }
`;

interface Props {
  autoHeight?: boolean;
}

export const UnderConstruction: FC<Props> = ({ autoHeight }) => {
  return (
    <Wrapper $autoHeight={autoHeight}>
      <Flex $justifyContent="center" $direction="column" $gap="sm">
        <Image src={logo} alt="logo" priority />
        <Heading size="xxl" textAlign="center">
          Under construction
        </Heading>
        <Paragraph size="lg" textAlign="center">
          This page is currently under construction. Please check back later.
        </Paragraph>
      </Flex>
    </Wrapper>
  );
};
