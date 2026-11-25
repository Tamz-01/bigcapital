import { HTMLSelect } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { useId } from 'react';
import styled from 'styled-components';
import { composeEntriesOnEditInclusiveTax, type BillFormValues } from './utils';
import { FFormGroup } from '@/components';
import { Features } from '@/constants';
import { InclusiveTaxOptions } from '@/constants/InclusiveTaxOptions';
import { EntriesActionsBar } from '@/containers/Entries/EntriesActionBar';
import { useFeatureCan } from '@/hooks/state';
import { TaxType } from '@/interfaces/TaxRates';

export function BillFormEntriesActions() {
  const { featureCan } = useFeatureCan();

  if (!featureCan(Features.SalesTax)) {
    return null;
  }
  return (
    <EntriesActionsBar>
      <BillExclusiveInclusiveSelect />
    </EntriesActionsBar>
  );
}

const taxOptions = InclusiveTaxOptions.map(({ key, label }) => ({
  value: key,
  label,
}));

function BillExclusiveInclusiveSelect() {
  const { values, setValues } = useFormikContext<BillFormValues>();
  const fieldId = useId();

  return (
    <InclusiveFormGroup
      name="inclusiveExclusiveTax"
      label="Amounts are"
      labelFor={fieldId}
      inline
    >
      <HTMLSelect
        id={fieldId}
        value={values.inclusiveExclusiveTax}
        options={taxOptions}
        onChange={({ currentTarget }) => {
          const taxType = currentTarget.value as TaxType;
          setValues((current) => ({
            ...current,
            inclusiveExclusiveTax: taxType,
            entries: composeEntriesOnEditInclusiveTax(taxType, current.entries),
          }));
        }}
      />
    </InclusiveFormGroup>
  );
}

const InclusiveFormGroup = styled(FFormGroup)`
  margin-left: auto;
`;
