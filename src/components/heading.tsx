import React from "react";
import { SpacingSize } from "../utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";

interface TypographyProps {
  as?: keyof JSX.IntrinsicElements;
  size?: Size;
  color?: string;
  marginTop?: SpacingSize;
  marginBottom?: SpacingSize;
  textAlign?: "left" | "center" | "right";
  children?: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  xs: "text-[16px]",
  sm: "text-[18px]",
  md: "text-[20px]",
  lg: "text-[24px]",
  xl: "text-[28px]",
  xxl: "text-[32px]",
  xxxl: "text-[48px]",
};
const elementBySize: Record<Size, keyof JSX.IntrinsicElements> = {
  xs: "h5",
  sm: "h4",
  md: "h3",
  lg: "h2",
  xl: "h1",
  xxl: "h1",
  xxxl: "h1",
};
const spacingClasses: Record<SpacingSize, { mt: string; mb: string }> = {
  "1": { mt: "mt-1", mb: "mb-1" },
  "2": { mt: "mt-2", mb: "mb-2" },
  "4": { mt: "mt-4", mb: "mb-4" },
  "6": { mt: "mt-6", mb: "mb-6" },
  "8": { mt: "mt-8", mb: "mb-8" },
  "10": { mt: "mt-10", mb: "mb-10" },
  "12": { mt: "mt-12", mb: "mb-12" },
  "16": { mt: "mt-16", mb: "mb-16" },
};

export const Heading: React.FC<TypographyProps> = ({
  as,
  size = "md",
  color = "#000000",
  marginTop,
  marginBottom,
  textAlign = "left",
  children,
  className = "",
}) => React.createElement(as ?? elementBySize[size], {
  className: `m-0 ${sizeClasses[size]} font-normal leading-[1.3] tracking-[0.4px] ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left"} ${marginTop ? spacingClasses[marginTop].mt : ""} ${marginBottom ? spacingClasses[marginBottom].mb : ""} ${className}`.trim(),
  style: { color },
  children,
});
