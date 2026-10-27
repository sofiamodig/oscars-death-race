import React from "react";

type Props = React.HTMLAttributes<HTMLParagraphElement> & { $width?: string };

const messageClasses = "my-2 flex w-fit items-center justify-center rounded border border-solid px-2 py-1 text-[14px] [&_svg]:mr-2 [&_svg]:min-w-6 [&_svg]:fill-current";

export const InfoMessage: React.FC<Props> = ({ $width, className = "", style, ...props }) => (
  <p className={`${messageClasses} text-info ${className}`} style={{ ...style, width: $width ?? "fit-content" }} {...props} />
);

export const ErrorMessage: React.FC<Props> = ({ $width, className = "", style, ...props }) => (
  <p className={`${messageClasses} text-error ${className}`} style={{ ...style, width: $width ?? "fit-content" }} {...props} />
);
