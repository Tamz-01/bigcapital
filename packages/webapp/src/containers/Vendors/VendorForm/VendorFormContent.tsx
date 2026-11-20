import intl from 'react-intl-universal';
import { useAppIntlContext } from '@/components/AppIntlProvider';
import { VendorFloatingActions } from './VendorFloatingActions';
import { VendorFormSections } from './VendorFormFields';
import { MasterRecordFormLayout } from '@/components/Forms/MasterRecordFormLayout';

export function VendorFormContent({
  onCancel: _onCancel,
}: {
  onCancel?: () => void;
}) {
  useAppIntlContext();
  return (
    <MasterRecordFormLayout
      sections={[
        ['primary', intl.get('basic')],
        ['financial', intl.get('financial')],
        ['billingAddress', intl.get('billing_address')],
        ['shippingAddress', intl.get('shipping_address')],
        ['notes', intl.get('notes')],
      ]}
      actions={<VendorFloatingActions />}
    >
      <VendorFormSections />
    </MasterRecordFormLayout>
  );
}
