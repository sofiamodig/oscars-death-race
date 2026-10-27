import SkeletonLoader from "./skeletonLoader";
import { Content, Wrapper } from "./movieCard";
import { Flex } from "@/styles/Flex";

export const MovieCardSkeleton = () => {
  const showMultiTitleRows = true;

  // //random number between 60 and 100
  const randomTitleWidth = 80;

  return (
    <Wrapper>
      <div className="absolute right-0 top-0 h-12 w-12">
        <SkeletonLoader width="100%" height="100%" />
      </div>
      <SkeletonLoader width="37%" height="100%" />
      <Content>
        <Flex $gap="xs" $direction="column" $alignItems="flex-start">
          <SkeletonLoader width={randomTitleWidth + "%"} height="20px" />
          {showMultiTitleRows && <SkeletonLoader width="40%" height="20px" />}
          <SkeletonLoader width="40px" height="10px" />
        </Flex>
        <Flex
          $gap="sm"
          $marginTop="sm"
          $direction="column"
          $alignItems="flex-start"
        >
          <SkeletonLoader width="60%" height="15px" />
          <SkeletonLoader width="80%" height="15px" />
          <SkeletonLoader width="50%" height="15px" />
        </Flex>
      </Content>
      <div className="absolute bottom-4 right-4 h-5 w-[114px]">
        <SkeletonLoader width="100%" height="100%" />
      </div>
    </Wrapper>
  );
};
