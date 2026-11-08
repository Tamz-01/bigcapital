import { test, expect } from '@playwright/test';
import intl from 'react-intl-universal';
import * as yup from 'yup';
import {
  SUPPORTED_LOCALES,
  resolveAccountLocale,
} from '../../src/constants/locales';
import { loadLocale } from '../../src/lang/loadLocale';
import { withEnglishFallback } from '../../src/lang/withEnglishFallback';
import english from '../../src/lang/en/index.json';
import lao from '../../src/lang/lo/index.json';
import { locale as englishValidation } from '../../src/lang/en/locale';
import { locale as laoValidation } from '../../src/lang/lo/locale';
import { locale as arabicValidation } from '../../src/lang/ar/locale';

// Load TSX modules while the test runner's collection-time transformer is active.
const validationDictionaries = {
  en: englishValidation,
  lo: laoValidation,
  ar: arabicValidation,
};

test('missing, blank and nested translations use English without mutating dictionaries', () => {
  const original = {
    title: 'Title',
    empty: 'Empty',
    whitespace: 'Whitespace',
    nullable: 'Nullable',
    omitted: 'Omitted',
    nested: { save: 'Save', cancel: 'Cancel' },
  };
  const partial = {
    title: 'ຫົວຂໍ້',
    empty: '',
    whitespace: ' \n ',
    nullable: null,
    nested: { save: 'ບັນທຶກ', cancel: '' },
  };
  expect(withEnglishFallback(original, partial)).toEqual({
    title: 'ຫົວຂໍ້',
    empty: 'Empty',
    whitespace: 'Whitespace',
    nullable: 'Nullable',
    omitted: 'Omitted',
    nested: { save: 'ບັນທຶກ', cancel: 'Cancel' },
  });
  expect(original.nested.save).toBe('Save');
  expect(partial.nested.cancel).toBe('');
});

for (const { value } of SUPPORTED_LOCALES) {
  test(`${value}: real catalogue retains every English message and supports formatted fallbacks`, async () => {
    const { messages, validation } = await loadLocale(value);
    expect(validation).toEqual(
      withEnglishFallback(englishValidation, validationDictionaries[value]),
    );
    // Verify every English leaf, not just the initial Lao labels.
    const verify = (
      base: Record<string, unknown>,
      actual: Record<string, unknown>,
    ) => {
      for (const [key, text] of Object.entries(base)) {
        if (typeof text === 'string') {
          expect(typeof actual[key], key).toBe('string');
          if (text.trim())
            expect((actual[key] as string).trim(), key).not.toBe('');
        } else if (text && typeof text === 'object') {
          verify(
            text as Record<string, unknown>,
            actual[key] as Record<string, unknown>,
          );
        }
      }
    };
    verify(english, messages);
    await intl.init({
      currentLocale: value,
      fallbackLocale: 'en',
      locales: {
        en: english,
        [value]: messages,
      },
    });
    expect(String(intl.get('first_name'))).toBe(messages.first_name);
    // A translated message must preserve user-entered mixed-language data.
    if (value === 'lo') {
      expect(String(intl.get('edit_contact', { name: 'ABC ລາວ 123' }))).toBe(
        lao.edit_contact.replace('{name}', 'ABC ລາວ 123'),
      );
    }
    expect(validation.mixed.defined).toBeTruthy();
  });
}

test('blank fallback also works with the real formatter and interpolation', async () => {
  const en = {
    nested: { title: 'Hello {name}' },
    'flat.title': 'Account {name}',
  };
  for (const code of ['lo', 'ar']) {
    const messages = withEnglishFallback(en, {
      nested: { title: ' ' },
      'flat.title': '',
    });
    await intl.init({
      currentLocale: code,
      fallbackLocale: 'en',
      locales: { en, [code]: messages },
    });
    expect(String(intl.get('nested.title', { name: 'Test' }))).toBe(
      'Hello Test',
    );
    expect(String(intl.get('flat.title', { name: 'Test' }))).toBe(
      'Account Test',
    );
  }
});

test('Arabic validation cannot leak into an untranslated Lao or English rule', async () => {
  const ar = await loadLocale('ar');
  yup.setLocale(ar.validation);
  expect(() => yup.string().required().validateSync('')).toThrow(/حقل/);
  const lo = await loadLocale('lo');
  yup.setLocale(lo.validation);
  expect(() => yup.string().required().validateSync('')).toThrow(
    'ຕ້ອງປ້ອນ this',
  );
  expect(() => yup.string().email().validateSync('invalid')).toThrow(
    'this ຕ້ອງເປັນອີເມວທີ່ຖືກຕ້ອງ',
  );
  yup.setLocale((await loadLocale('en')).validation);
});

test('Lao remains a personal choice with company then English defaults', () => {
  expect(resolveAccountLocale('lo', 'ar')).toBe('lo');
  expect(resolveAccountLocale('en', 'ar')).toBe('en');
  expect(resolveAccountLocale(undefined, 'ar')).toBe('ar');
  expect(resolveAccountLocale('unsupported', 'unsupported')).toBe('en');
  expect(lao.first_name).not.toBe(english.first_name);
});
