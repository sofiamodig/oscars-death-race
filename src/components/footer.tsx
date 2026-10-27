import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import { Paragraph } from "./paragraph";
import Image from "next/image";

const Footer = () => {
  return (
    <Box className="mt-auto" $marginLeft="xl" $marginRight="xl" $marginBottom="xxl">
      <Box $marginTop="xxxl" $marginBottom="md">
        <Flex
          $justifyContent="center"
          $alignItems="center"
          $direction="column"
        >
          <Paragraph textAlign="center" marginBottom="sm">
            Do you like this website and want to support it?
          </Paragraph>
          <a className="[&_img]:h-12 [&_img]:transition-transform [&_img]:duration-200 hover:[&_img]:scale-105" href="https://www.buymeacoffee.com/fordvspurrari" target="_blank">
            <div className="aspect-[545/153] w-full max-w-[200px]">
              <Image
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                width={545}
                height={153}
                priority
              />
            </div>
          </a>
        </Flex>
      </Box>
      <Flex
        $direction="column"
        $justifyContent="center"
        $alignItems="center"
        $gap="xs"
        $marginBottom="md"
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
    </Box>
  );
};

export default Footer;
