import { DRAWERS } from '@/constants/drawers';
import { index as ReceiptDetailDrawer } from '@/containers/Drawers/ReceiptDetailDrawer';

export function ReceiptsListDrawers() {
  return <ReceiptDetailDrawer name={DRAWERS.RECEIPT_DETAILS} />;
}
