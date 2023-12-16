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
      return "12px";
    case "sm":
      return "14px";
    case "md":
      return "16px";
    case "lg":
      return "20px";
    case "xl":
      return "24px";
    case "xxl":
      return "28px";
    case "xxxl":
      return "32px";
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

const StyledTypography = styled.p<StyledProps>`
  ${({ $size, $color, $marginTop, $marginBottom, $textAlign }) => css`
    font-size: ${sizeToPixels($size)};
    color: ${$color};
    margin-top: ${$marginTop ? spacingToPixels($marginTop) : "0"};
    margin-bottom: ${$marginBottom ? spacingToPixels($marginBottom) : "0"};
    text-align: ${$textAlign || "left"};
  `}
`;

export const Paragraph: React.FC<TypographyProps> = ({
  as,
  size = "md",
  color = "var(--color-text-secondary)",
  marginTop,
  marginBottom,
  textAlign = "left",
  children,
}) => {
  return (
    <StyledTypography
      as={as}
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
