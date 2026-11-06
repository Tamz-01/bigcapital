import { Knex } from 'knex';

// DECIMAL(13, 9) only stores rates below 10,000. USD/LAK exceeds that
// range, including in the ledger entries created when a bill is opened.
const rateColumns = [
  'sales_invoices',
  'sales_estimates',
  'sales_receipts',
  'payment_receives',
  'bills',
  'bills_payments',
  'credit_notes',
  'vendor_credits',
  'accounts_transactions',
  'manual_journals',
  'cashflow_transactions',
  'expenses_transactions',
  'refund_credit_note_transactions',
  'refund_vendor_credit_transactions',
  'bill_located_costs',
].map((table) => ({ table, column: 'exchange_rate', precision: 13, scale: 9 }));

rateColumns.push({
  table: 'contacts',
  column: 'opening_balance_exchange_rate',
  precision: 13,
  scale: 9,
});

async function existingRateColumns(knex: Knex): Promise<typeof rateColumns> {
  // Tenant connections normalize identifiers to uppercase. MySQL's hasTable /
  // hasColumn metadata comparisons do not apply that normalization consistently.
  // Resolve the stored names explicitly, also supporting lowercase installations.
  const [rows] = await knex.raw(
    'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()',
  );
  const columns = rows.map((row) => ({
    table: row.TABLE_NAME ?? row.table_name ?? row.tableName,
    column: row.COLUMN_NAME ?? row.column_name ?? row.columnName,
  }));
  return rateColumns.flatMap((rate) => {
    const stored = columns.find(
      (entry) =>
        entry.table.toLowerCase() === rate.table &&
        entry.column.toLowerCase() === rate.column,
    );
    return stored ? [{ ...rate, ...stored }] : [];
  });
}

export async function up(knex: Knex): Promise<void> {
  for (const { table, column } of await existingRateColumns(knex)) {
    await knex.schema.alterTable(table, (builder) => {
      builder.decimal(column, 24, 12).nullable().alter();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Validate every column before changing any table. A rollback must never
  // silently round or truncate rates entered after the precision expansion.
  const existing: typeof rateColumns = [];
  for (const rate of await existingRateColumns(knex)) {
    const incompatible = await knex(rate.table)
      .whereRaw('ABS(??) >= 10000 OR ?? <> ROUND(??, 9)', [
        rate.column,
        rate.column,
        rate.column,
      ])
      .first();
    if (incompatible) {
      throw new Error(
        `Cannot narrow ${rate.table}.${rate.column}: existing rates would lose precision.`,
      );
    }
    existing.push(rate);
  }
  for (const { table, column, precision, scale } of existing) {
    await knex.schema.alterTable(table, (builder) => {
      builder.decimal(column, precision, scale).nullable().alter();
    });
  }
}
