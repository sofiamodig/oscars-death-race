import styled, { css } from "styled-components";

const messageStyles = css<{ $width?: string }>`
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: ${({ $width }) => $width ?? "fit-content"};

  svg {
    margin-right: 8px;
    min-width: 24px;
    fill: currentColor;
  }
`;

export const InfoMessage = styled.p<{ $width?: string }>`
  ${messageStyles}
  color: var(--color-info);
  border-color: var(--color-info);
`;

export const ErrorMessage = styled.p<{ $width?: string }>`
  ${messageStyles}
  color: var(--color-error);
  border-color: var(--color-error);
`;
