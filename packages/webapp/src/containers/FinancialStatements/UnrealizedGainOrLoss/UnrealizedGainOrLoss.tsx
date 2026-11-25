import React from 'react';
import { UnrealizedGainOrLossLoadingBar } from './components';
import { UnrealizedGainOrLossActionsBar } from './UnrealizedGainOrLossActionsBar';
import { UnrealizedGainOrLossHeader } from './UnrealizedGainOrLossHeader';
import { UnrealizedGainOrLossProvider } from './UnrealizedGainOrLossProvider';
import {
  withUnrealizedGainOrLossActions,
  type WithUnrealizedGainOrLossActionsProps,
} from './withUnrealizedGainOrLossActions';
import { FinancialStatement, DashboardPageContent } from '@/components';

function UnrealizedGainOrLossContent({
  toggleUnrealizedGainOrLossFilterDrawer,
}: WithUnrealizedGainOrLossActionsProps) {
  const handleFilterSubmit = (_filter: Record<string, unknown>) => {};

  React.useEffect(
    () => () => {
      toggleUnrealizedGainOrLossFilterDrawer(false);
    },
    [toggleUnrealizedGainOrLossFilterDrawer],
  );

  return (
    <UnrealizedGainOrLossProvider>
      <UnrealizedGainOrLossActionsBar />
      <DashboardPageContent>
        <FinancialStatement>
          <UnrealizedGainOrLossHeader
            pageFilter={{}}
            onSubmitFilter={handleFilterSubmit}
          />

          <UnrealizedGainOrLossLoadingBar />
        </FinancialStatement>
      </DashboardPageContent>
    </UnrealizedGainOrLossProvider>
  );
}

export const UnrealizedGainOrLoss = withUnrealizedGainOrLossActions(
  UnrealizedGainOrLossContent,
);
