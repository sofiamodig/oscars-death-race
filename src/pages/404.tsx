import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Flex } from "@/styles/Flex";
import gif from "../assets/images/notfound.gif";
import Image from "next/image";

const NotFound = () => {
  return (
    <Flex $direction="column" $marginTop="xxl" $marginBottom="xxl">
      <Heading size="xxl" marginBottom="xs">
        Oh no!
      </Heading>
      <Paragraph marginBottom="lg">
        The page you were looking for cannot be found.
      </Paragraph>
      <Image
        src={gif}
        alt="People at the oscars state being confused because they announced the wrong movie as the winner"
      />
    </Flex>
  );
};

export default NotFound;
