import React from "react";
import styled, { css } from "styled-components";
import { SpinnerIcon } from "../assets/icons/Spinner";
import Link from "next/link";

type Size = "sm" | "md" | "lg";

type Variant = "primary" | "secondary" | "danger";

interface Props {
  type?: "button" | "submit" | "reset" | "link";
  to?: string;
  label: string;
  onClick?: (e: any) => void;
  disabled?: boolean;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  width?: string;
}

const sharedButtonStyles = css<{
  $size: Size;
  $variant: Variant;
  $isLoading?: boolean;
  $width?: string;
}>`
  padding: ${({ $size }) =>
    $size === "sm" ? "8px 16px" : $size === "md" ? "8px 24px" : "8px 32px"};
  height: ${({ $size }) => ($size === "sm" ? "32px" : "48px")};
  display: flex;
  align-items: center;
  font-size: 16px;
  width: ${({ $width }) => $width ?? "auto"};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  position: relative;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  ${({ $variant }) =>
    $variant === "danger"
      ? css`
          background-color: var(--color-ui-red);
          color: var(--color-neutral-0);

          &:hover {
            background-color: var(--color-ui-red-darker);
            color: var(--color-neutral-0);
          }
        `
      : $variant === "primary"
      ? css`
          background-color: var(--color-primary-500);
          color: var(--color-neutral-0);

          &:hover {
            color: var(--color-neutral-0);
            background-color: var(--color-primary-700);
          }
        `
      : css`
          background-color: transparent;
          color: var(--color-primary-500);
          border: 1px solid var(--color-primary-500);

          &:hover {
            color: var(--color-primary-500);
            border-color: var(--color-primary-700);
          }
        `}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  ${({ $isLoading }) =>
    $isLoading &&
    css`
      span {
        opacity: 0;
      }
    `};

  svg {
    animation: spinner 0.8s ease infinite;
    opacity: 0.7;
    fill: #fff;
  }
`;

const Spinner = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 24px;
  width: 24px;
`;

const StyledButton = styled.button<{
  $size: Size;
  $variant: Variant;
  $isLoading: boolean;
  $width?: string;
}>`
  ${sharedButtonStyles}
`;

const StyledLink = styled(Link)<{
  $size: Size;
  $variant: Variant;
  $width?: string;
}>`
  ${sharedButtonStyles}
`;

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
  if (type === "link") {
    return (
      <StyledLink
        href={to ?? "/"}
        type={type}
        onClick={onClick}
        $variant={variant}
        $size={size}
        $width={width}
      >
        {label}
      </StyledLink>
    );
  } else {
    return (
      <StyledButton
        type={type}
        onClick={(e) => {
          if (!disabled) {
            e.preventDefault();
            e.stopPropagation();
            onClick && onClick(e);
          }
        }}
        disabled={disabled}
        $variant={variant}
        $size={size}
        $isLoading={isLoading}
        $width={width}
      >
        {isLoading && (
          <Spinner>
            <SpinnerIcon />
          </Spinner>
        )}
        <span>{label}</span>
      </StyledButton>
    );
  }
};
