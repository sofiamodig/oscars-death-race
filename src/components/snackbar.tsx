import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { CheckIcon } from "../assets/icons/CheckIcon";
import { ErrorIcon } from "../assets/icons/ErrorIcon";
import { InfoIcon } from "../assets/icons/InfoIcon";

type SnackbarType = "info" | "success" | "error";

interface Props {
  message: string;
  type?: SnackbarType;
  duration?: number; // Duration in milliseconds
}

const SnackbarWrapper = styled.div<{
  $type: SnackbarType;
  $isVisible: boolean;
}>`
  visibility: ${({ $isVisible }) => ($isVisible ? "visible" : "hidden")};
  background-color: var(--color-neutral-0);
  color: ${({ $type }) => {
    switch ($type) {
      case "success":
        return "var(--color-success)";
      case "error":
        return "var(--color-error)";
      default:
        return "var(--color-neutral-900)";
    }
  }};
  text-align: center;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  z-index: 1000;
  right: 24px;
  bottom: 24px;
  transition: visibility 0.4s, opacity 0.4s linear;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  box-shadow: 0 0 10px var(--color-neutral-400);

  svg {
    fill: ${({ $type }) => {
      switch ($type) {
        case "success":
          return "var(--color-success)";
        case "error":
          return "var(--color-error)";
        default:
          return "var(--color-info)";
      }
    }};
    margin-right: 8px;
  }
`;

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
    <SnackbarWrapper $type={type} $isVisible={isVisible}>
      {Icon(type)}
      {message}
    </SnackbarWrapper>,
    document.body
  );
};

export default Snackbar;
