import { FC, ChangeEvent } from "react";
import styled from "styled-components";
import { CheckIcon } from "../assets/icons/CheckIcon";

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Label = styled.label`
  margin-left: 8px;
  cursor: pointer;
  font-size: 14px;
`;

const HiddenCheckbox = styled.input`
  opacity: 0;
  position: absolute;
  z-index: -1;
`;

const StyledCheckbox = styled.div<{ $checked: boolean }>`
  width: 24px;
  min-width: 24px;
  height: 24px;
  border: 1px solid var(--color-neutral-500);
  border-radius: 4px;
  background-color: var(--color-neutral-0);
`;

export const Checkbox: FC<Props> = ({ label, checked, onChange }) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <CheckboxContainer>
      <HiddenCheckbox
        id={label}
        type="checkbox"
        checked={checked}
        onChange={handleInputChange}
      />
      <StyledCheckbox $checked={checked} onClick={() => onChange(!checked)}>
        {checked && <CheckIcon />}
      </StyledCheckbox>
      <Label htmlFor={label}>{label}</Label>
    </CheckboxContainer>
  );
};
