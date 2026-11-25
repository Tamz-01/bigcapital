import React from 'react';
import { RealizedGainOrLossLoadingBar } from './components';
import { RealizedGainOrLossActionsBar } from './RealizedGainOrLossActionsBar';
import { RealizedGainOrLossHeader } from './RealizedGainOrLossHeader';
import { RealizedGainOrLossProvider } from './RealizedGainOrLossProvider';
import {
  withRealizedGainOrLossActions,
  type WithRealizedGainOrLossActionsProps,
} from './withRealizedGainOrLossActions';
import { FinancialStatement, DashboardPageContent } from '@/components';

function RealizedGainOrLossContent({
  toggleRealizedGainOrLossFilterDrawer,
}: WithRealizedGainOrLossActionsProps) {
  const handleFilterSubmit = (_filter: Record<string, unknown>) => {};

  React.useEffect(
    () => () => {
      toggleRealizedGainOrLossFilterDrawer(false);
    },
    [toggleRealizedGainOrLossFilterDrawer],
  );

  return (
    <RealizedGainOrLossProvider>
      <RealizedGainOrLossActionsBar />

      <DashboardPageContent>
        <FinancialStatement>
          <RealizedGainOrLossHeader
            pageFilter={{}}
            onSubmitFilter={handleFilterSubmit}
          />
          <RealizedGainOrLossLoadingBar />
        </FinancialStatement>
      </DashboardPageContent>
    </RealizedGainOrLossProvider>
  );
}

export const RealizedGainOrLoss = withRealizedGainOrLossActions(
  RealizedGainOrLossContent,
);
