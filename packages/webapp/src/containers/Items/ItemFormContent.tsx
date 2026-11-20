import intl from 'react-intl-universal';
import { ItemFormSections } from './ItemFormFields';
import { ItemFormFloatingActions } from './ItemFormFloatingActions';
import { useAppIntlContext } from '@/components/AppIntlProvider';
import { MasterRecordFormLayout } from '@/components/Forms/MasterRecordFormLayout';

export function ItemFormContent() {
  useAppIntlContext();
  return (
    <MasterRecordFormLayout
      sections={[
        ['primary', intl.get('basic')],
        ['selling', intl.get('sales')],
        ['purchasing', intl.get('purchases')],
        ['inventory', intl.get('inventory')],
      ]}
      actions={<ItemFormFloatingActions />}
    >
      <ItemFormSections />
    </MasterRecordFormLayout>
  );
}
