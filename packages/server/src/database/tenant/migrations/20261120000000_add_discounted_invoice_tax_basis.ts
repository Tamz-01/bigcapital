import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('items_entries', (table) => {
    // Previously posted entries keep the tax basis used by their journal.
    table.boolean('tax_on_discounted_amount').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('items_entries', (table) => {
    table.dropColumn('tax_on_discounted_amount');
  });
}
