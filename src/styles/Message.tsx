import React from "react";

type Props = React.HTMLAttributes<HTMLParagraphElement> & { $width?: string };

const messageClasses = "my-2 flex w-fit items-center justify-center rounded border border-solid px-2 py-1 text-[14px] [&_svg]:mr-2 [&_svg]:min-w-6 [&_svg]:fill-current";

export const InfoMessage: React.FC<Props> = ({ $width, className = "", style, ...props }) => (
  <p className={`${messageClasses} border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 ${className}`} style={{ ...style, width: $width ?? "fit-content" }} {...props} />
);

export const ErrorMessage: React.FC<Props> = ({ $width, className = "", style, ...props }) => (
  <p className={`${messageClasses} border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200 ${className}`} style={{ ...style, width: $width ?? "fit-content" }} {...props} />
);
