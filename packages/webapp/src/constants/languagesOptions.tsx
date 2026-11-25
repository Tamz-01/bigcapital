import intl from 'react-intl-universal';
import { SUPPORTED_LOCALES } from './locales';

export const getLanguages = () =>
  SUPPORTED_LOCALES.map(({ name, value }) => ({
    name: value === 'en' ? intl.get('english').d(name) : name,
    value,
  }));
