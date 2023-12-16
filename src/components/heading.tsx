import React from "react";
import styled, { css } from "styled-components";
import { SpacingSize, spacingToPixels } from "../utils";

type size = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";

interface TypographyProps {
  as?: keyof JSX.IntrinsicElements;
  size?: size;
  color?: string;
  marginTop?: SpacingSize;
  marginBottom?: SpacingSize;
  textAlign?: "left" | "center" | "right";
  children?: React.ReactNode;
}

const sizeToPixels = (size?: size) => {
  switch (size) {
    case "xs":
      return "16px";
    case "sm":
      return "18px";
    case "md":
      return "20px";
    case "lg":
      return "24px";
    case "xl":
      return "28px";
    case "xxl":
      return "32px";
    case "xxxl":
      return "48px";
    default:
      return "16px";
  }
};

type StyledProps = {
  $size: size;
  $color: string;
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
  $textAlign: "left" | "center" | "right";
};

const StyledTypography = styled.h2<StyledProps>`
  ${({ $size, $color, $marginTop, $marginBottom, $textAlign }) => css`
    font-size: ${sizeToPixels($size)};
    color: ${$color};
    margin-top: ${$marginTop ? spacingToPixels($marginTop) : "0"};
    margin-bottom: ${$marginBottom ? spacingToPixels($marginBottom) : "0"};
    text-align: ${$textAlign || "left"};
  `}
`;

const sizeElementMap: Record<string, keyof JSX.IntrinsicElements> = {
  xxs: "h6",
  xs: "h5",
  sm: "h4",
  md: "h3",
  lg: "h2",
  xl: "h1",
  xxl: "h1",
};

export const Heading: React.FC<TypographyProps> = ({
  as,
  size = "md",
  color = "var(--color-text-primary)",
  marginTop,
  marginBottom,
  textAlign = "left",
  children,
}) => {
  const Element = as || sizeElementMap[size];

  return (
    <StyledTypography
      as={Element}
      $size={size}
      $color={color}
      $marginTop={marginTop}
      $marginBottom={marginBottom}
      $textAlign={textAlign}
    >
      {children}
    </StyledTypography>
  );
};
