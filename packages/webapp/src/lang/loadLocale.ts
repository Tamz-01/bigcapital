import type { SupportedLocale } from '../constants/locales';
import { withEnglishFallback } from './withEnglishFallback';

const messageLoaders = {
  en: () => import('./en/index.json'),
  lo: () => import('./lo/index.json'),
  ar: () => import('./ar/index.json'),
};

const validationLoaders = {
  en: () => import('./en/locale'),
  lo: () => import('./lo/locale'),
  ar: () => import('./ar/locale'),
};

// Prepare complete dictionaries before activating a language. Starting from
// English also resets validation rules omitted by the newly selected language.
export async function loadLocale(locale: SupportedLocale) {
  const [messages, english, validation, englishValidation] = await Promise.all([
    messageLoaders[locale]().then((module) => module.default),
    import('./en/index.json').then((module) => module.default),
    validationLoaders[locale]().then((module) => module.locale),
    import('./en/locale').then((module) => module.locale),
  ]);
  return {
    messages: withEnglishFallback(english, messages),
    english,
    validation: withEnglishFallback(englishValidation, validation),
  };
}
