import * as FF from 'fp-ts/function';
import { useEffect } from 'react';
import styled from 'styled-components';
import { PreferencesBrandingBoot } from './PreferencesBrandingBoot';
import { PreferencesBrandingForm } from './PreferencesBrandingForm';
import {
  PreferencesBrandingFormContent,
  PreferencesBrandingFormFooter,
} from './PreferencesBrandingFormContent';
import type { WithDashboardActionsProps } from '@/containers/Dashboard/withDashboardActions';
import { Stack } from '@/components';
import { withDashboardActions } from '@/containers/Dashboard/withDashboardActions';

type PreferencesBrandingPageRootProps = Pick<
  WithDashboardActionsProps,
  'changePreferencesPageTitle'
>;

function PreferencesBrandingPageRoot({
  changePreferencesPageTitle,
}: PreferencesBrandingPageRootProps) {
  useEffect(() => {
    changePreferencesPageTitle('Branding');
  }, [changePreferencesPageTitle]);

  return (
    <BrandingStack>
      <PreferencesBrandingBoot>
        <PreferencesBrandingForm>
          <PreferencesBrandingFormContent />
          <PreferencesBrandingFormFooter />
        </PreferencesBrandingForm>
      </PreferencesBrandingBoot>
    </BrandingStack>
  );
}

export const PreferencesBrandingPage = FF.pipe(
  PreferencesBrandingPageRoot,
  withDashboardActions,
);

const BrandingStack = styled(Stack)`
  width: 100%;
  max-width: 900px;
  flex: 1;
  padding: 20px 40px 0;

  @media (max-width: 767.98px) {
    padding: 14px;
  }
`;
