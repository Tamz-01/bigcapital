import { test, expect } from '@playwright/test';
import intl from 'react-intl-universal';
import english from '../../src/lang/en/index.json';
import lao from '../../src/lang/lo/index.json';

function leaves(
  value: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  return Object.assign(
    {},
    ...Object.entries(value).map(([key, text]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof text === 'string'
        ? { [path]: text }
        : leaves(text as Record<string, unknown>, path);
    }),
  );
}

test('Lao covers every catalogue message and retains variables and markup', async () => {
  const en = leaves(english);
  const lo = leaves(lao);
  expect(Object.keys(lo).sort()).toEqual(Object.keys(en).sort());
  await intl.init({ currentLocale: 'lo', locales: { lo: lao } });
  const technical = new Set([
    'paypal',
    'audit_log.col_ip',
    'pro',
    'Starter',
    'Essential',
    'Enterprise',
    'mm_dd_yy',
    'dd_mm_yy',
    'yy_mm_dd',
    'mm_dd_yy_',
    'dd_mm_yy_',
    'yy_mm_dd_',
    'plan_radio_name',
    'date_formats.YYYY MMM DD',
  ]);
  for (const [key, text] of Object.entries(en)) {
    expect(lo[key].trim(), key).not.toBe('');
    if (!technical.has(key)) expect(lo[key], key).toMatch(/[\u0e80-\u0eff]/);
    const variables = text.match(/\{\w+\}/g) || [];
    expect((lo[key].match(/\{\w+\}/g) || []).sort(), key).toEqual(
      [...variables].sort(),
    );
    expect(lo[key].match(/<\/?[A-Za-z][^>]*>/g) || [], key).toEqual(
      text.match(/<\/?[A-Za-z][^>]*>/g) || [],
    );
    // Exercise real formatting, including all transaction and contact variables.
    if (variables.length && !text.includes('<')) {
      const params = Object.fromEntries(
        variables.map((v) => [v.slice(1, -1), 'ABC ລາວ 中文 123']),
      );
      expect(String(intl.get(key, params)), key).toContain('ABC ລາວ 中文 123');
    }
  }
});
