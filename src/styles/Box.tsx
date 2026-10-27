import React from "react";
import { SpacingSize } from "../utils";

type BoxProps = React.HTMLAttributes<HTMLDivElement> & {
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
};

const spacingClasses: Record<SpacingSize, { pt: string; pb: string; pl: string; pr: string; mt: string; mb: string; ml: string; mr: string }> = {
  xxs: { pt: "pt-xxs", pb: "pb-xxs", pl: "pl-xxs", pr: "pr-xxs", mt: "mt-xxs", mb: "mb-xxs", ml: "ml-xxs", mr: "mr-xxs" },
  xs: { pt: "pt-xs", pb: "pb-xs", pl: "pl-xs", pr: "pr-xs", mt: "mt-xs", mb: "mb-xs", ml: "ml-xs", mr: "mr-xs" },
  sm: { pt: "pt-sm", pb: "pb-sm", pl: "pl-sm", pr: "pr-sm", mt: "mt-sm", mb: "mb-sm", ml: "ml-sm", mr: "mr-sm" },
  md: { pt: "pt-md", pb: "pb-md", pl: "pl-md", pr: "pr-md", mt: "mt-md", mb: "mb-md", ml: "ml-md", mr: "mr-md" },
  lg: { pt: "pt-lg", pb: "pb-lg", pl: "pl-lg", pr: "pr-lg", mt: "mt-lg", mb: "mb-lg", ml: "ml-lg", mr: "mr-lg" },
  xl: { pt: "pt-xl", pb: "pb-xl", pl: "pl-xl", pr: "pr-xl", mt: "mt-xl", mb: "mb-xl", ml: "ml-xl", mr: "mr-xl" },
  xxl: { pt: "pt-xxl", pb: "pb-xxl", pl: "pl-xxl", pr: "pr-xxl", mt: "mt-xxl", mb: "mb-xxl", ml: "ml-xxl", mr: "mr-xxl" },
  xxxl: { pt: "pt-xxxl", pb: "pb-xxxl", pl: "pl-xxxl", pr: "pr-xxxl", mt: "mt-xxxl", mb: "mb-xxxl", ml: "ml-xxxl", mr: "mr-xxxl" },
};

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(function Box(
  {
    $paddingTop,
    $paddingBottom,
    $paddingLeft,
    $paddingRight,
    $marginTop,
    $marginBottom,
    $marginLeft,
    $marginRight,
    $width,
    $maxWidth,
    className = "",
    style,
    ...props
  },
  ref
) {
  const classes = [
    $paddingTop && spacingClasses[$paddingTop].pt,
    $paddingBottom && spacingClasses[$paddingBottom].pb,
    $paddingLeft && spacingClasses[$paddingLeft].pl,
    $paddingRight && spacingClasses[$paddingRight].pr,
    $marginTop && spacingClasses[$marginTop].mt,
    $marginBottom && spacingClasses[$marginBottom].mb,
    $marginLeft === "auto" ? "ml-auto" : $marginLeft && spacingClasses[$marginLeft].ml,
    $marginRight === "auto" ? "mr-auto" : $marginRight && spacingClasses[$marginRight].mr,
    $width === "100%" ? "w-full" : "",
    $maxWidth === "100%" ? "max-w-full" : "",
    className,
  ].filter(Boolean).join(" ");

  return <div ref={ref} className={classes} style={{ ...style, ...($width && $width !== "100%" ? { width: $width } : {}), ...($maxWidth && $maxWidth !== "100%" ? { maxWidth: $maxWidth } : {}) }} {...props} />;
});
