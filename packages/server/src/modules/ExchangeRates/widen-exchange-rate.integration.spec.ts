import knexFactory, { Knex } from 'knex';
import {
  up,
  down,
} from '../../database/tenant/migrations/20261107010000_widen_exchange_rate_precision';

// Run only against a disposable database, never an organization's database.
const describeDatabase = process.env.TEST_FX_DATABASE
  ? describe
  : describe.skip;
describeDatabase('USD/LAK exchange-rate storage', () => {
  let db: Knex;
  beforeAll(async () => {
    db = knexFactory({
      client: 'mysql2',
      pool: { min: 0, max: 1 },
      connection: {
        host: process.env.TEST_FX_HOST || '127.0.0.1',
        port: Number(process.env.TEST_FX_PORT || 3306),
        user: process.env.TEST_FX_USER,
        password: process.env.TEST_FX_PASSWORD,
        database: process.env.TEST_FX_DATABASE,
      },
    });
    await db.raw("SET SESSION sql_mode = 'STRICT_ALL_TABLES'");
    for (const table of ['bills', 'accounts_transactions']) {
      await db.schema.createTable(table, (builder) => {
        builder.increments();
        builder.decimal('exchange_rate', 13, 9);
      });
    }
    await db.schema.createTable('CONTACTS', (builder) => {
      builder.increments();
      builder.decimal('OPENING_BALANCE_EXCHANGE_RATE', 13, 9);
    });
  });
  afterAll(async () => {
    await db?.destroy();
  });

  it('reproduces the old limit, then stores both bill and ledger rates without rounding', async () => {
    await expect(
      db('bills').insert({ exchange_rate: '22000.125' }),
    ).rejects.toThrow();
    await db('bills').insert({ exchange_rate: '0.000045455' });
    await up(db);
    await db('bills').insert({ exchange_rate: '22000.125' });
    await db('accounts_transactions').insert({ exchange_rate: '22000.125' });
    await db('CONTACTS').insert({ OPENING_BALANCE_EXCHANGE_RATE: '22000.125' });
    expect(
      (await db('bills').orderBy('id')).map((row) => Number(row.exchange_rate)),
    ).toEqual([0.000045455, 22000.125]);
    expect(
      Number((await db('accounts_transactions').first()).exchange_rate),
    ).toBe(22000.125);
    expect(
      Number((await db('CONTACTS').first()).OPENING_BALANCE_EXCHANGE_RATE),
    ).toBe(22000.125);
    await expect(down(db)).rejects.toThrow(
      'existing rates would lose precision',
    );
  });
});
