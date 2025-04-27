import Image from "next/image";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Flex } from "@/styles/Flex";
import gif from "../assets/images/notfound.gif";
import styled from "styled-components";

const GifWrapper = styled.div`
  width: 95%;
  max-width: 600px;

  img {
    width: 100%;
    height: auto;
  }
`;

const NotFound = () => {
  return (
    <Flex
      $direction="column"
      $justifyContent="center"
      $marginTop="xxl"
      $marginBottom="xxl"
    >
      <Heading size="xxl" marginBottom="xs">
        Oh no!
      </Heading>
      <Paragraph marginBottom="lg" textAlign="center">
        The page you were looking for cannot be found.
      </Paragraph>
      <GifWrapper>
        <Image
          src={gif}
          alt="People at the oscars being confused because they announced the wrong movie as the winner"
        />
      </GifWrapper>
    </Flex>
  );
};

export default NotFound;
