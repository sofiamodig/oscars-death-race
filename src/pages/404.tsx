import Image from "next/image";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Flex } from "@/styles/Flex";
import gif from "../assets/images/notfound.gif";

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
      <div className="w-[95%] max-w-[600px] [&_img]:h-auto [&_img]:w-full">
        <Image
          src={gif}
          alt="People at the oscars being confused because they announced the wrong movie as the winner"
        />
      </div>
    </Flex>
  );
};

export default NotFound;
