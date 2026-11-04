import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { $isSelected: boolean };

export const Chip: React.FC<Props> = ({ $isSelected, className = "", ...props }) => (
  <button
    className={`flex w-fit items-center rounded-lg border-2 border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-black transition-all duration-200 ease-in-out hover:border-[#897b2c] dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:border-[#b39930] ${$isSelected ? "!border-[#897b2c] dark:!border-[#b39930]" : ""} ${className}`}
    {...props}
  />
);
