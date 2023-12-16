import styled from "styled-components";
import { SpacingSize, spacingToPixels } from "../utils";

export const Box = styled.div<{
  $paddingTop?: SpacingSize;
  $paddingBottom?: SpacingSize;
  $paddingLeft?: SpacingSize;
  $paddingRight?: SpacingSize;
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
  $marginLeft?: SpacingSize | "auto";
  $marginRight?: SpacingSize | "auto";
  $width?: string;
  $maxWidth?: string;
}>`
  padding-top: ${({ $paddingTop }) => spacingToPixels($paddingTop)};
  padding-bottom: ${({ $paddingBottom }) => spacingToPixels($paddingBottom)};
  padding-left: ${({ $paddingLeft }) => spacingToPixels($paddingLeft)};
  padding-right: ${({ $paddingRight }) => spacingToPixels($paddingRight)};
  margin-top: ${({ $marginTop }) => spacingToPixels($marginTop)};
  margin-bottom: ${({ $marginBottom }) => spacingToPixels($marginBottom)};
  margin-left: ${({ $marginLeft }) =>
    $marginLeft === "auto" ? "auto" : spacingToPixels($marginLeft)};
  margin-right: ${({ $marginRight }) =>
    $marginRight === "auto" ? "auto" : spacingToPixels($marginRight)};
  width: ${({ $width }) => $width ?? "auto"};
  max-width: ${({ $maxWidth }) => $maxWidth ?? "auto"};
`;
