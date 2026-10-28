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
  xs: "text-[12px]",
  sm: "text-[14px]",
  md: "text-[16px]",
  lg: "text-[20px]",
  xl: "text-[24px]",
  xxl: "text-[28px]",
  xxxl: "text-[32px]",
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

export const Paragraph: React.FC<TypographyProps> = ({
  as: Element = "p",
  size = "md",
  color = "#404040",
  marginTop,
  marginBottom,
  textAlign = "left",
  children,
  className = "",
}) => React.createElement(Element, {
  className: `m-0 ${sizeClasses[size]} ${textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left"} ${marginTop ? spacingClasses[marginTop].mt : ""} ${marginBottom ? spacingClasses[marginBottom].mb : ""} ${className}`.trim(),
  style: { color },
  children,
});
