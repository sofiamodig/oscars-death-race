import { FC } from "react";
import styled from "styled-components";
import { Paragraph } from "./paragraph";

const OuterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  -webkit-tap-highlight-color: transparent;
`;

const ToggleContainer = styled.div`
  display: inline-block;
`;

const ToggleSlider = styled.div<{ $isOn: boolean }>`
  background-color: ${({ $isOn }) =>
    $isOn ? "var(--color-ui-green)" : "var(--color-neutral-300)"};
  width: 44px;
  height: 24px;
  border-radius: 34px;
  position: relative;
  transition: background-color 0.2s;

  &::after {
    content: "";
    position: absolute;
    height: 18px;
    aspect-ratio: 1;
    top: 3px;
    left: 3px;
    bottom: 4px;
    background-color: white;
    transition: transform 0.2s;
    border-radius: 50%;
    transform: ${({ $isOn }) => ($isOn ? "translateX(20px)" : "none")};
  }
`;

interface Props {
  label: string;
  value: boolean;
  onToggle: () => void;
}

export const Toggle: FC<Props> = ({ label, value, onToggle }) => {
  return (
    <OuterContainer onClick={onToggle}>
      <Paragraph as="span" size="xs">
        {label}
      </Paragraph>
      <ToggleContainer>
        <ToggleSlider $isOn={value} />
      </ToggleContainer>
    </OuterContainer>
  );
};
