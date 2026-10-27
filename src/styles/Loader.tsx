import React from "react";

export const Loader: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div aria-label="Loading" className={`h-[30px] w-[60px] animate-loader-dots bg-[radial-gradient(circle_closest-side,var(--color-primary-500)_90%,transparent)_0%_50%/calc(100%_/_3)_50%_no-repeat,radial-gradient(circle_closest-side,var(--color-primary-500)_90%,transparent)_50%_50%/calc(100%_/_3)_50%_no-repeat,radial-gradient(circle_closest-side,var(--color-primary-500)_90%,transparent)_100%_50%/calc(100%_/_3)_50%_no-repeat] ${className}`} />
);
