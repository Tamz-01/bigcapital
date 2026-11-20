import React from 'react';
import intl from 'react-intl-universal';
import styles from './InvoiceFormHeader.module.scss';
import { InvoiceFormHeaderFields } from './InvoiceFormHeaderFields';
import { useInvoiceDueAmountFormatted } from './utils';
import { Group, PageFormBigNumber } from '@/components';

/**
 * Invoice form header section.
 */
export function InvoiceFormHeader() {
  return (
    <Group
      position="apart"
      align={'flex-start'}
      p="25px 32px"
      className={`sales-form-header ${styles.root}`}
    >
      <InvoiceFormHeaderFields />
      <InvoiceFormBigTotal />
    </Group>
  );
}

/**
 * Big total of invoice form header.
 * @returns {React.ReactNode}
 */
function InvoiceFormBigTotal() {
  // Calculate the total due amount of invoice entries.
  const totalFormatted = useInvoiceDueAmountFormatted();

  return (
    <PageFormBigNumber label={intl.get('due_amount')} amount={totalFormatted} />
  );
}
