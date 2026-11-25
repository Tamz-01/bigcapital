import clsx from 'classnames';
import React from 'react';
import styles from './MatchTransactionCheckbox.module.scss';
import { useUncontrolled } from '@/hooks/useUncontrolled';

export interface MatchTransactionCheckboxProps {
  active?: boolean;
  initialActive?: boolean;
  onChange?: (state: boolean) => void;
  label: string | React.ReactNode;
  date: string;
}

export function MatchTransactionCheckbox({
  active,
  initialActive,
  onChange,
  label,
  date,
}: MatchTransactionCheckboxProps) {
  const [checked, setChecked] = useUncontrolled<boolean>({
    value: active,
    initialValue: initialActive,
    finalValue: false,
    onChange,
  });

  return (
    <label className={clsx(styles.root, { [styles.active]: checked })}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.date}>Date: {date}</span>
      </span>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={(event) => setChecked(event.currentTarget.checked)}
      />
    </label>
  );
}
