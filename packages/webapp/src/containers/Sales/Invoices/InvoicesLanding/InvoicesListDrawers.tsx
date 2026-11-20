import { DRAWERS } from '@/constants/drawers';
import { index as InvoiceDetailDrawer } from '@/containers/Drawers/InvoiceDetailDrawer';

export function InvoicesListDrawers() {
  return <InvoiceDetailDrawer name={DRAWERS.INVOICE_DETAILS} />;
}
