import styled from "styled-components";
import SkeletonLoader from "./skeletonLoader";
import { Content, Wrapper } from "./movieCard";
import { Flex } from "@/styles/Flex";

const CheckBox = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  height: 48px;
  width: 48px;
`;

const LinkWrapper = styled.div`
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 114px;
  height: 20px;
`;

export const MovieCardSkeleton = () => {
  const showMultiTitleRows = true;

  // //random number between 60 and 100
  const randomTitleWidth = 80;

  return (
    <Wrapper>
      <CheckBox>
        <SkeletonLoader width="100%" height="100%" />
      </CheckBox>
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
      <LinkWrapper>
        <SkeletonLoader width="100%" height="100%" />
      </LinkWrapper>
    </Wrapper>
  );
};
