import React, { CSSProperties } from "react";
import styled from "styled-components";

const Container = styled.div<{ width: string | undefined }>`
  display: flex;
  flex-direction: column;
  width: ${({ width }) => (width ? width : "100%")};
`;

const Label = styled.label`
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-700);
`;

const StyledInput = styled.input<{ $errormessage: boolean }>`
  border: 1px solid
    ${({ $errormessage }) =>
      $errormessage ? "var(--color-error)" : "var(--color-neutral-200)"};
  padding: 8px 16px;
  height: 48px;
  font-size: 16px;
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: var(--color-neutral-400);
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
  }
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
`;

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "password" | "email" | "number";
  value: string;
  setValue: (value: string) => void;
  errorMessage?: string;
  width?: string;
  style?: CSSProperties;
}

export const TextInput: React.FC<InputProps> = ({
  label,
  placeholder,
  type = "text",
  value,
  setValue,
  errorMessage,
  width,
  style,
}) => {
  return (
    <Container width={width} style={style}>
      {label && <Label>{label}</Label>}
      <StyledInput
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        $errormessage={Boolean(errorMessage)}
      />
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </Container>
  );
};
