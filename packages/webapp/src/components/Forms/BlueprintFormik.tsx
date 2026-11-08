import {
  FormGroup,
  InputGroup,
  NumericInput,
  Checkbox,
  RadioGroup,
  Switch,
  EditableText,
  TextArea,
  HTMLSelect,
} from '@blueprintjs-formik/core';
import { TimezoneSelect } from '@blueprintjs-formik/datetime';
import {
  MultiSelect,
  Suggest,
  Select,
  FormikMultiSelect,
  FormikSuggest,
  withFormikMultiSelect,
  withFormikSuggest,
  withFormikSelect,
} from '@blueprintjs-formik/select';
import React from 'react';
import { useAppIntlContext } from '../AppIntlProvider';
import { FDateInput } from './FDateInput';
import { FSelect, BPSelect } from './Select';

// FastField caches control props. Values remain in the mounted Formik form.
function FInputGroup(props: React.ComponentProps<typeof InputGroup>) {
  const { currentLocale } = useAppIntlContext();
  return <InputGroup key={currentLocale} {...props} />;
}

function FTextArea(props: React.ComponentProps<typeof TextArea>) {
  const { currentLocale } = useAppIntlContext();
  return <TextArea key={currentLocale} {...props} />;
}

export {
  FormGroup as FFormGroup,
  FInputGroup,
  NumericInput as FNumericInput,
  Checkbox as FCheckbox,
  RadioGroup as FRadioGroup,
  Switch as FSwitch,
  FSelect,
  BPSelect,
  FormikMultiSelect as FMultiSelect,
  EditableText as FEditableText,
  FormikSuggest as FSuggest,
  FTextArea,
  FDateInput,
  HTMLSelect as FHTMLSelect,
  TimezoneSelect as FTimezoneSelect,
  Suggest,
  MultiSelect,
  Select,
  withFormikSelect,
  withFormikMultiSelect,
  withFormikSuggest,
};
