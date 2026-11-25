// @ts-nocheck
import styled from 'styled-components';
import { Icon } from '../Icon';
import { StepperStepState } from './types';

interface StepperStepProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  step?: number;
  active?: boolean;
  state?: StepperStepState;
  allowStepClick?: boolean;
  onClick?: () => void;
}

export function StepperStep({
  label,
  description,
  step,
  state,
  allowStepClick,
  onClick,
}: StepperStepProps) {
  return (
    <StepButton
      as={allowStepClick ? 'button' : 'div'}
      type={allowStepClick ? 'button' : undefined}
      onClick={allowStepClick ? onClick : undefined}
      aria-current={state === StepperStepState.Progress ? 'step' : undefined}
    >
      <StepIconWrap>
        <StepIcon
          isCompleted={state === StepperStepState.Completed}
          isActive={state === StepperStepState.Progress}
        >
          {state === StepperStepState.Completed ? (
            <Icon icon={'done'} iconSize={24} />
          ) : (
            <StepIconText>{step}</StepIconText>
          )}
        </StepIcon>
      </StepIconWrap>

      <StepTextWrap>
        <StepTitle
          isCompleted={state === StepperStepState.Completed}
          isActive={state === StepperStepState.Progress}
        >
          {label}
        </StepTitle>
        {description && (
          <StepDescription
            isCompleted={state === StepperStepState.Completed}
            isActive={state === StepperStepState.Progress}
          >
            {description}
          </StepDescription>
        )}
      </StepTextWrap>
    </StepButton>
  );
}

const StepButton = styled.button`
  background: transparent;
  color: inherit;
  border: 0;
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 2px 6px;
  text-align: start;

  @media (max-width: 599.98px) {
    flex: 1 1 0;
    flex-direction: column;
    gap: 4px;
    text-align: center;

    > :last-child {
      text-align: center;
    }
  }
`;

const StepIcon = styled.span`
  display: block;
  height: 24px;
  width: 24px;
  display: block;
  line-height: 24px;
  border-radius: 24px;
  text-align: center;
  background-color: ${(props) =>
    props.isCompleted || props.isActive
      ? 'var(--color-stepper-step-active-background)'
      : 'var(--color-stepper-step-background)'};
  color: var(--color-stepper-step-text);
  margin: auto;
  font-size: 12px;
`;

const StepTitle = styled.div`
  color: ${(props) =>
    props.isCompleted || props.isActive
      ? 'var(--color-stepper-step-title-active-text)'
      : 'var(--color-stepper-step-title-text)'};
`;
const StepDescription = styled.div`
  font-size: 12px;
  margin-top: 10px;
  color: ${(props) =>
    props.isCompleted || props.isActive
      ? 'var(--color-stepper-step-description-active-text)'
      : 'var(--color-stepper-step-description-text)'};
`;

const StepIconWrap = styled.div`
  display: flex;
`;

const StepTextWrap = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: start;
`;

const StepIconText = styled.div``;
