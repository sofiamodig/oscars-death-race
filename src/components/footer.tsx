import { Box } from "@/styles/Box";
import { Flex } from "@/styles/Flex";
import Image from "next/image";

const Footer = () => {
  return (
    <div className="mt-auto px-4 pt-10 pb-20 bg-white dark:bg-neutral-800">
      <div>
        <div className="flex flex-col items-center mb-4">
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
        </div>
      </div>
      <div className="flex flex-col items-center">
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
      </div>
    </div>
  );
};

export default Footer;
