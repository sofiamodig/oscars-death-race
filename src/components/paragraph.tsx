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
  xxs: { mt: "mt-xxs", mb: "mb-xxs" },
  xs: { mt: "mt-xs", mb: "mb-xs" },
  sm: { mt: "mt-sm", mb: "mb-sm" },
  md: { mt: "mt-md", mb: "mb-md" },
  lg: { mt: "mt-lg", mb: "mb-lg" },
  xl: { mt: "mt-xl", mb: "mb-xl" },
  xxl: { mt: "mt-xxl", mb: "mb-xxl" },
  xxxl: { mt: "mt-xxxl", mb: "mb-xxxl" },
};

export const Paragraph: React.FC<TypographyProps> = ({
  as: Element = "p",
  size = "md",
  color = "var(--color-text-secondary)",
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
