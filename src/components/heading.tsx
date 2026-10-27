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
  xxs: { mt: "mt-xxs", mb: "mb-xxs" },
  xs: { mt: "mt-xs", mb: "mb-xs" },
  sm: { mt: "mt-sm", mb: "mb-sm" },
  md: { mt: "mt-md", mb: "mb-md" },
  lg: { mt: "mt-lg", mb: "mb-lg" },
  xl: { mt: "mt-xl", mb: "mb-xl" },
  xxl: { mt: "mt-xxl", mb: "mb-xxl" },
  xxxl: { mt: "mt-xxxl", mb: "mb-xxxl" },
};

export const Heading: React.FC<TypographyProps> = ({
  as,
  size = "md",
  color = "var(--color-text-primary)",
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
