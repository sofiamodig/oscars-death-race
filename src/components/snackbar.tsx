import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { CheckIcon } from "../assets/icons/CheckIcon";
import { ErrorIcon } from "../assets/icons/ErrorIcon";
import { InfoIcon } from "../assets/icons/InfoIcon";

type SnackbarType = "info" | "success" | "error";

interface Props {
  message: string;
  type?: SnackbarType;
  duration?: number; // Duration in milliseconds
}

const Icon = (type: SnackbarType) => {
  switch (type) {
    case "success":
      return <CheckIcon />;

    case "error":
      return <ErrorIcon />;

    default:
      return <InfoIcon />;
  }
};

const Snackbar: React.FC<Props> = ({
  message,
  type = "info",
  duration = 100000000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration]);

  return ReactDOM.createPortal(
    <div className={`fixed bottom-6 right-6 z-[1000] flex items-center justify-center rounded-lg bg-white px-4 py-2 text-center text-sm shadow-[0_0_10px_#a3a3a3] transition-opacity duration-300 ${isVisible ? "visible opacity-100" : "invisible opacity-0"} ${type === "success" ? "text-green-600 [&_svg]:fill-green-600" : type === "error" ? "text-red-600 [&_svg]:fill-red-600" : "text-neutral-900 [&_svg]:fill-blue-600"} [&_svg]:mr-2`}>
      {Icon(type)}
      {message}
    </div>,
    document.body
  );
};

export default Snackbar;
