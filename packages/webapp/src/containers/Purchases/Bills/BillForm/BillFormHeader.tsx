import React from 'react';
import intl from 'react-intl-universal';
import { BillFormHeaderFields } from './BillFormHeaderFields';
import { useBillDueAmountFormatted } from './utils';
import { PageForm, PageFormBigNumber } from '@/components';

/**
 * Fill form header.
 */
export function BillFormHeader() {
  return (
    <PageForm.Header className="purchase-form-header">
      <BillFormHeaderFields />
      <BillFormBigTotal />
    </PageForm.Header>
  );
}

function BillFormBigTotal() {
  const dueAmountFormatted = useBillDueAmountFormatted();

  return (
    <PageFormBigNumber
      label={intl.get('due_amount')}
      amount={dueAmountFormatted}
    />
  );
}
