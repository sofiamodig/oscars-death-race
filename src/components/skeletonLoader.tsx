import { FC } from "react";
import styled, { keyframes } from "styled-components";

// Create a keyframe animation for the loading effect
const shimmer = keyframes`
  0% {
    background-position: -500px 0;
  }
  100% {
    background-position: 500px 0;
  }
`;

const Wrapper = styled.div<{
  $width: SizeObj | string;
  $height: SizeObj | string;
  $round: boolean;
}>`
  animation: ${shimmer} 1.5s infinite linear;
  background: linear-gradient(
    to right,
    var(--color-neutral-100) 4%,
    var(--color-neutral-200) 25%,
    var(--color-neutral-100) 36%
  );
  background-size: 1000px 100%;
  height: ${({ $height }) =>
    typeof $height === "object" ? $height.$sm : $height};
  width: ${({ $width }) => (typeof $width === "object" ? $width.$sm : $width)};
  aspect-ratio: ${({ $round }) => ($round ? "1" : "auto")};
  border-radius: ${({ $round }) => ($round ? "50%" : "2px")};

  @media screen and (min-width: 768px) {
    height: ${({ $height }) =>
      typeof $height === "object" ? $height.$md : $height};
    width: ${({ $width }) =>
      typeof $width === "object" ? $width.$md : $width};
  }

  @media screen and (min-width: 1024px) {
    height: ${({ $height }) =>
      typeof $height === "object" ? $height.$lg : $height};
    width: ${({ $width }) =>
      typeof $width === "object" ? $width.$lg : $width};
  }

  @media screen and (min-width: 1280px) {
    height: ${({ $height }) =>
      typeof $height === "object" ? $height.$xl : $height};
    width: ${({ $width }) =>
      typeof $width === "object" ? $width.$xl : $width};
  }
`;

type SizeObj = {
  $sm: string;
  $md: string;
  $lg: string;
  $xl: string;
};

interface Props {
  width?: SizeObj | string;
  height?: SizeObj | string;
  round?: boolean;
  className?: string;
}

const SkeletonLoader: FC<Props> = ({
  width = "100%",
  height = "auto",
  round = false,
  className,
}) => {
  return (
    <Wrapper
      $width={width}
      $height={height}
      $round={round}
      className={className}
    />
  );
};

export default SkeletonLoader;
