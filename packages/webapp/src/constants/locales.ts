// Offer only languages currently supported by the application loader.
export const SUPPORTED_LOCALES = [
  { name: 'English', value: 'en' },
  { name: 'العربية', value: 'ar' },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['value'];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return SUPPORTED_LOCALES.some((locale) => locale.value === value);
}

export function resolveAccountLocale(
  personal: unknown,
  company: unknown,
): string {
  return isSupportedLocale(personal)
    ? personal
    : isSupportedLocale(company)
      ? company
      : 'en';
}
