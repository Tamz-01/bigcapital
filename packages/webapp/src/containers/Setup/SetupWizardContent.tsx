import intl from 'react-intl-universal';
import { SetupCongratsPage } from './SetupCongratsPage';
import { SetupInitializingForm } from './SetupInitializingForm';
import { SetupOrganizationPage } from './SetupOrganizationPage';
import { Stepper } from '@/components/Stepper';

interface SetupWizardContentProps {
  stepIndex: number;
}

/**
 * Setup wizard content.
 */
export function SetupWizardContent({ stepIndex }: SetupWizardContentProps) {
  return (
    <Stepper
      active={stepIndex}
      classNames={{
        items: 'setup-page__steps',
      }}
    >
      <Stepper.Step label={intl.get('organization_details')}>
        <SetupOrganizationPage />
      </Stepper.Step>

      <Stepper.Step label={intl.get('setup.plan.initializing')}>
        <SetupInitializingForm />
      </Stepper.Step>

      <Stepper.Step label={intl.get('setup.plan.congrats')}>
        <SetupCongratsPage />
      </Stepper.Step>
    </Stepper>
  );
}
