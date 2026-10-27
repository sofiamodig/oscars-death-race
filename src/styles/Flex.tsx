import React from "react";
import { SpacingSize } from "../utils";
import { Box } from "./Box";

type FlexProps = React.ComponentProps<typeof Box> & {
  $direction?: "row" | "column";
  $justifyContent?: "center" | "space-between" | "flex-start" | "flex-end";
  $alignItems?: "center" | "flex-start" | "flex-end";
  $fullheight?: boolean;
  $gap?: SpacingSize;
};

const gapClasses: Record<SpacingSize, string> = {
  xxs: "gap-xxs",
  xs: "gap-xs",
  sm: "gap-sm",
  md: "gap-md",
  lg: "gap-lg",
  xl: "gap-xl",
  xxl: "gap-xxl",
  xxxl: "gap-xxxl",
};

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(function Flex(
  {
    $direction = "row",
    $justifyContent = "space-between",
    $alignItems = "center",
    $fullheight,
    $gap,
    className = "",
    ...props
  },
  ref
) {
  const classes = [
    "flex",
    $direction === "column" ? "flex-col" : "flex-row",
    ({ center: "justify-center", "space-between": "justify-between", "flex-start": "justify-start", "flex-end": "justify-end" } as const)[$justifyContent],
    ({ center: "items-center", "flex-start": "items-start", "flex-end": "items-end" } as const)[$alignItems],
    $fullheight && "h-full",
    $gap && gapClasses[$gap],
    className,
  ].filter(Boolean).join(" ");

  return <Box ref={ref} className={classes} {...props} />;
});
