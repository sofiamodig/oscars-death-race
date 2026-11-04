import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import Image from "next/image";

const Footer = () => {
  return (
    <Box className="mt-auto" $marginLeft="10" $marginRight="10" $marginBottom="12">
      <Box $marginTop="16" $marginBottom="6">
        <Flex
          $justifyContent="center"
          $alignItems="center"
          $direction="column"
        >
          <p className=" !mb-4 text-center">
            Do you like this website and want to support it?
          </p>
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
        $gap="2"
        $marginBottom="6"
      >
        <p className="text-sm text-center">
          Questions or ideas? Contact{" "}
          <a href="https://www.reddit.com/user/fordvspurrari/" target="_BLANK">
            @fordvspurrari
          </a>{" "}
          on reddit
        </p>
        <p className="text-sm">
          <a href="https://www.reddit.com/r/oscarsdeathrace/" target="_BLANK">
            r/oscarsdeathrace
          </a>
        </p>
      </Flex>
    </Box>
  );
};

export default Footer;
