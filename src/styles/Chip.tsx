import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { $isSelected: boolean };

export const Chip: React.FC<Props> = ({ $isSelected, className = "", ...props }) => (
  <button
    className={`flex w-fit items-center rounded-lg border-2 px-2 py-1 text-xs font-medium text-black transition-all duration-200 ease-in-out hover:border-[#bb9c38] ${$isSelected ? "border-[#bb9c38]" : "border-neutral-300"} bg-white ${className}`}
    {...props}
  />
);
