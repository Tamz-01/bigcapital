import { useAppIntlContext } from '@/components/AppIntlProvider';
import {
  ControlGroup,
  Divider,
  Icon as BlueprintIcon,
} from '@blueprintjs/core';
import intl from 'react-intl-universal';
import { CustomerFormSectionTitle } from './CustomerFormSectionTitle';
import { CustomerTypeRadioField } from './CustomerTypeRadioField';
import {
  SalutationList,
  SalutationItem,
  DisplayNameList,
  useDisplayNameSynchronizer,
  FInputGroup,
  FFormGroup,
  Box,
  Icon,
  Stack,
} from '@/components';
import { useAutofocus } from '@/hooks';

export function CustomerFormBasicSection() {
  useAppIntlContext();
  const firstNameFieldRef = useAutofocus<HTMLInputElement>();
  const { syncDisplayName, createFieldOnChange } = useDisplayNameSynchronizer();

  return (
    <Box data-section-id="primary">
      <CustomerFormSectionTitle>
        {intl.get('contact_form.customer_details')}
      </CustomerFormSectionTitle>

      {/**-----------Customer type. -----------*/}
      <CustomerTypeRadioField />

      {/**----------- Contact name -----------*/}
      <FFormGroup name={'salutation'} label={intl.get('contact_name')} inline>
        <ControlGroup fill>
          <SalutationList
            name={'salutation'}
            popoverProps={{ minimal: true }}
            onItemChange={(item: SalutationItem) =>
              syncDisplayName({ salutation: item.key })
            }
          />
          <FInputGroup
            name={'firstName'}
            placeholder={intl.get('first_name')}
            inputRef={(ref: HTMLInputElement | null) => {
              if (ref) firstNameFieldRef.current = ref;
            }}
            data-testId={'customer-first-name-input'}
            onChange={createFieldOnChange('firstName')}
            fill
          />
          <FInputGroup
            name={'lastName'}
            placeholder={intl.get('last_name')}
            data-testId={'customer-last-name-input'}
            onChange={createFieldOnChange('lastName')}
            fill
          />
        </ControlGroup>
      </FFormGroup>

      <FFormGroup
        name={'code'}
        label={intl.get('contact_form.customer_code')}
        helperText={intl.get('contact_form.code_help')}
        inline
      >
        <FInputGroup name={'code'} data-testId={'customer-code-input'} fill />
      </FFormGroup>

      {/*----------- Company Name -----------*/}
      <FFormGroup name={'companyName'} label={intl.get('company_name')} inline>
        <FInputGroup
          name={'companyName'}
          data-testId={'customer-company-name-input'}
          onChange={createFieldOnChange('companyName')}
          fill
        />
      </FFormGroup>

      {/*----------- Display Name -----------*/}
      <FFormGroup
        name={'displayName'}
        label={intl.get('display_name')}
        helperText={intl.get('contact_form.display_name_help')}
        inline
      >
        <DisplayNameList
          name={'displayName'}
          popoverProps={{ minimal: true }}
          buttonProps={{
            fill: true,
            'data-testId': 'customer-display-name-select',
          }}
        />
      </FFormGroup>

      <Divider style={{ margin: '20px 0' }} />

      {/*------------ Vendor email -----------*/}
      <FFormGroup name={'email'} label={intl.get('customer_email')} inline>
        <FInputGroup name={'email'} leftIcon={<Icon icon="envelope" />} />
      </FFormGroup>

      {/*------------ Phone number -----------*/}
      <FFormGroup
        name={'workPhone'}
        className={'form-group--phone-number'}
        label={intl.get('phone_number')}
        inline={true}
      >
        <Stack spacing={10}>
          <FInputGroup
            name={'workPhone'}
            placeholder={intl.get('work')}
            leftIcon="phone"
          />
          <FInputGroup
            name={'personalPhone'}
            placeholder={intl.get('mobile')}
          />
        </Stack>
      </FFormGroup>

      {/*------------ Vendor website -----------*/}
      <FFormGroup name={'website'} label={intl.get('website')} inline={true}>
        <FInputGroup
          name={'website'}
          placeholder={'http://'}
          leftIcon={<BlueprintIcon icon="globe-network" />}
        />
      </FFormGroup>
    </Box>
  );
}
