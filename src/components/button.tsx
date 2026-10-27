import React from "react";
import Link from "next/link";
import { SpinnerIcon } from "../assets/icons/Spinner";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "danger";

interface Props {
  type?: "button" | "submit" | "reset" | "link";
  to?: string;
  label: string;
  onClick?: (e: any) => void;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  width?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-4",
  md: "h-12 px-6",
  lg: "h-12 px-8",
};
const variantClasses: Record<Variant, string> = {
  primary: "border border-transparent bg-primary-500 text-neutral-0 hover:bg-primary-700",
  secondary: "border border-primary-500 bg-transparent text-primary-500 hover:border-primary-700",
  danger: "border border-transparent bg-ui-red text-neutral-0 hover:bg-ui-red-darker",
};
const classes = "relative flex items-center justify-center rounded font-sans text-base transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:animate-spinner [&_svg]:fill-white [&_svg]:opacity-70";

export const Button: React.FC<Props> = ({
  type = "button",
  to,
  label,
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  isLoading = false,
  width,
}) => {
  const className = `${classes} ${sizeClasses[size]} ${variantClasses[variant]} ${isLoading ? "[&_span]:opacity-0" : ""}`;
  const style = width ? { width } : undefined;
  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (type === "submit" && !onClick) return;
    if (type !== "link") {
      e.preventDefault();
      e.stopPropagation();
    }
    onClick?.(e);
  };

  const content = <>
    {isLoading && <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2"><SpinnerIcon /></span>}
    <span>{label}</span>
  </>;

  return type === "link" ? (
    <Link href={to ?? "/"} onClick={handleClick} className={className} style={style} aria-disabled={disabled}>
      {content}
    </Link>
  ) : (
    <button type={type} onClick={handleClick} disabled={disabled} className={className} style={style}>
      {content}
    </button>
  );
};
