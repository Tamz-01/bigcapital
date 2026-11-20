// @ts-nocheck
import { FormGroup } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs-formik/select';
import React, { useCallback } from 'react';
import type { TaxRate } from '@bigcapital/sdk-ts';
import { CellType } from '@/constants';

function matchesTaxRate(query: string, taxRate: TaxRate) {
  const search = query.trim().toLowerCase();
  const label = taxRate.nameFormatted ?? taxRate.name ?? '';
  return `${label} ${taxRate.code ?? ''}`.toLowerCase().includes(search);
}

export function TaxRatesSuggestInputCell({
  column: { id, suggestProps, formGroupProps },
  row: { index },
  cell: { value: cellValue },
  payload: { errors, updateData, taxRates },
}) {
  const error = errors?.[index]?.[id];

  // Handle the item selected.
  const handleItemSelected = useCallback(
    (value, taxRate) => {
      updateData(index, id, taxRate.id);
    },
    [updateData, index, id],
  );

  return (
    <FormGroup intent={error ? Intent.DANGER : null} {...formGroupProps}>
      <Suggest<any>
        selectedValue={cellValue}
        items={taxRates}
        valueAccessor={'id'}
        labelAccessor={'code'}
        textAccessor={'nameFormatted'}
        itemPredicate={matchesTaxRate}
        popoverProps={{ minimal: true, boundary: 'window' }}
        inputProps={{ placeholder: '' }}
        fill={true}
        onItemChange={handleItemSelected}
        {...suggestProps}
      />
    </FormGroup>
  );
}

TaxRatesSuggestInputCell.cellType = CellType.Field;
