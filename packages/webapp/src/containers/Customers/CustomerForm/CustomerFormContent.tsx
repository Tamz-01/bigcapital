import intl from 'react-intl-universal';
import { useAppIntlContext } from '@/components/AppIntlProvider';
import { CustomerFloatingActions } from './CustomerFloatingActions';
import { CustomerFormSections } from './CustomerFormFields';
import { MasterRecordFormLayout } from '@/components/Forms/MasterRecordFormLayout';

export function CustomerFormContent() {
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
      actions={<CustomerFloatingActions />}
    >
      <CustomerFormSections />
    </MasterRecordFormLayout>
  );
}
