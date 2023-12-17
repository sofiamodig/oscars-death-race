import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Paragraph } from "./paragraph";
import styled from "styled-components";
import Image from "next/image";

const OuterWrapper = styled(Box)`
  margin-top: auto;
`;

const Coffee = styled(Flex)`
  img {
    height: 48px;
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: scale(1.05);
    }
  }
`;

const ImageWrapper = styled.div`
  max-width: 234px;
  aspect-ratio: 545/120;
  width: 100%;

  img {
    width: 100%;
    height: 100%;
  }
`;

const Footer = () => {
  return (
    <OuterWrapper $marginLeft="xl" $marginRight="xl" $marginBottom="xl">
      <Box $marginTop="xxxl" $marginBottom="md">
        <Coffee
          $justifyContent="center"
          $alignItems="center"
          $direction="column"
        >
          <Paragraph textAlign="center" marginBottom="sm">
            Do you like this website and want to support it?
          </Paragraph>
          <a href="https://www.buymeacoffee.com/fordvspurrari" target="_blank">
            <ImageWrapper>
              <Image
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                width={545}
                height={153}
              />
            </ImageWrapper>
          </a>
        </Coffee>
      </Box>
      <Flex
        $direction="column"
        $justifyContent="center"
        $alignItems="center"
        $gap="xs"
      >
        <Paragraph textAlign="center" size="sm">
          Questions or ideas? Contact{" "}
          <a href="https://www.reddit.com/user/fordvspurrari/" target="_BLANK">
            @fordvspurrari
          </a>{" "}
          on reddit
        </Paragraph>
        <Paragraph size="sm">
          <a href="https://www.reddit.com/r/oscarsdeathrace/" target="_BLANK">
            r/oscarsdeathrace
          </a>
        </Paragraph>
      </Flex>
    </OuterWrapper>
  );
};

export default Footer;
