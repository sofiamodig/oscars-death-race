import { FC } from "react";

type SizeObj = { $sm: string; $md: string; $lg: string; $xl: string };
interface Props {
  width?: SizeObj | string;
  height?: SizeObj | string;
  round?: boolean;
  className?: string;
}

const SkeletonLoader: FC<Props> = ({ width = "100%", height = "auto", round = false, className = "" }) => {
  const responsiveValue = (value: SizeObj | string, size: keyof SizeObj) =>
    typeof value === "string" ? value : value[size];
  const style = {
    "--skeleton-width-sm": responsiveValue(width, "$sm"),
    "--skeleton-width-md": responsiveValue(width, "$md"),
    "--skeleton-width-lg": responsiveValue(width, "$lg"),
    "--skeleton-width-xl": responsiveValue(width, "$xl"),
    "--skeleton-height-sm": responsiveValue(height, "$sm"),
    "--skeleton-height-md": responsiveValue(height, "$md"),
    "--skeleton-height-lg": responsiveValue(height, "$lg"),
    "--skeleton-height-xl": responsiveValue(height, "$xl"),
  } as React.CSSProperties;

  return <div style={style} className={`animate-shimmer bg-[linear-gradient(to_right,var(--color-neutral-100)_4%,var(--color-neutral-200)_25%,var(--color-neutral-100)_36%)] bg-[length:1000px_100%] h-[var(--skeleton-height-sm)] w-[var(--skeleton-width-sm)] md:h-[var(--skeleton-height-md)] md:w-[var(--skeleton-width-md)] lg:h-[var(--skeleton-height-lg)] lg:w-[var(--skeleton-width-lg)] xl:h-[var(--skeleton-height-xl)] xl:w-[var(--skeleton-width-xl)] ${round ? "aspect-square rounded-full" : "rounded-sm"} ${className}`} />;
};

export default SkeletonLoader;
