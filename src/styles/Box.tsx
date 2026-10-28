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
  "1": { pt: "pt-1", pb: "pb-1", pl: "pl-1", pr: "pr-1", mt: "mt-1", mb: "mb-1", ml: "ml-1", mr: "mr-1" },
  "2": { pt: "pt-2", pb: "pb-2", pl: "pl-2", pr: "pr-2", mt: "mt-2", mb: "mb-2", ml: "ml-2", mr: "mr-2" },
  "4": { pt: "pt-4", pb: "pb-4", pl: "pl-4", pr: "pr-4", mt: "mt-4", mb: "mb-4", ml: "ml-4", mr: "mr-4" },
  "6": { pt: "pt-6", pb: "pb-6", pl: "pl-6", pr: "pr-6", mt: "mt-6", mb: "mb-6", ml: "ml-6", mr: "mr-6" },
  "8": { pt: "pt-8", pb: "pb-8", pl: "pl-8", pr: "pr-8", mt: "mt-8", mb: "mb-8", ml: "ml-8", mr: "mr-8" },
  "10": { pt: "pt-10", pb: "pb-10", pl: "pl-10", pr: "pr-10", mt: "mt-10", mb: "mb-10", ml: "ml-10", mr: "mr-10" },
  "12": { pt: "pt-12", pb: "pb-12", pl: "pl-12", pr: "pr-12", mt: "mt-12", mb: "mb-12", ml: "ml-12", mr: "mr-12" },
  "16": { pt: "pt-16", pb: "pb-16", pl: "pl-16", pr: "pr-16", mt: "mt-16", mb: "mb-16", ml: "ml-16", mr: "mr-16" },
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
