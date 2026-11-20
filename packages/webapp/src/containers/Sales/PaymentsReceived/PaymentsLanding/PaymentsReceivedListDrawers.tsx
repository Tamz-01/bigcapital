import { DRAWERS } from '@/constants/drawers';
import { index as PaymentReceiveDetailDrawer } from '@/containers/Drawers/PaymentReceiveDetailDrawer';

export function PaymentsReceivedListDrawers() {
  return <PaymentReceiveDetailDrawer name={DRAWERS.PAYMENT_RECEIVED_DETAILS} />;
}
