import React from 'react';
import { SetupWizardContent } from './SetupWizardContent';
import { useCurrentOrganization } from '@/hooks/query';
import { useIsOrganizationSetupCompleted } from '@/hooks/state';

/**
 * Wizard setup right section.
 */
export function SetupRightSection() {
  const { data: organization } = useCurrentOrganization();
  const isOrganizationReady = !!organization?.isReady;
  const isOrganizationBuildRunning = !!organization?.isBuildRunning;
  const isOrganizationSetupCompleted = useIsOrganizationSetupCompleted();

  const scenarios = [
    {
      condition: !isOrganizationReady && !isOrganizationBuildRunning,
      step: 'organization',
    },
    { condition: isOrganizationBuildRunning, step: 'initializing' },
    { condition: isOrganizationSetupCompleted, step: 'congrats' },
  ];
  const setupStep = scenarios.find((scenario) => scenario.condition);
  const setupStepIndex = setupStep ? scenarios.indexOf(setupStep) : -1;

  return (
    <section className="setup-page__right-section">
      <SetupWizardContent stepIndex={setupStepIndex} />
    </section>
  );
}
