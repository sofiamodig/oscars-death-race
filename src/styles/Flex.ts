import styled from "styled-components";
import { SpacingSize, spacingToPixels } from "../utils";
import { Box } from "./Box";

export const Flex = styled(Box)<{
  $direction?: "row" | "column";
  $justifyContent?: "center" | "space-between" | "flex-start" | "flex-end";
  $alignItems?: "center" | "flex-start" | "flex-end";
  $fullheight?: boolean;
  $gap?: SpacingSize;
}>`
  display: flex;
  flex-direction: ${({ $direction }) => $direction ?? "row"};
  justify-content: ${({ $justifyContent }) =>
    $justifyContent ?? "space-between"};
  align-items: ${({ $alignItems: $alignItems }) => $alignItems ?? "center"};
  height: ${({ $fullheight: $fullHeight }) => ($fullHeight ? "100%" : "auto")};
  gap: ${({ $gap: $gap }) => ($gap ? spacingToPixels($gap) : 0)};
`;
