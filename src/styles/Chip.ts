import styled from "styled-components";

export const Chip = styled.button<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 4px 8px;
  background-color: var(--color-neutral-0);
  color: var(--color-neutral-1000);
  font-size: 12px;
  font-weight: 500;
  border: 2px solid;
  border-color: ${({ $isSelected }) =>
    $isSelected ? "var(--color-primary-500)" : "var(--color-neutral-300)"};
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: var(--color-primary-500);
  }
`;
