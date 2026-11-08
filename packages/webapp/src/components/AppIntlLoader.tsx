import React from 'react';
import intl from 'react-intl-universal';
import moment from 'moment';
import 'moment/locale/ar-ly';
import { setLocale } from 'yup';
import { AppIntlProvider } from './AppIntlProvider';
import { isSupportedLocale } from '@/constants/locales';
import { getCookie, setCookie } from '@/utils';
import { loadLocale } from '@/lang/loadLocale';

export default function AppIntlLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = React.useRef(getCookie('locale', 'en'));
  const [currentLocale, setLocaleState] = React.useState('en');
  const [isReady, setIsReady] = React.useState(false);
  const [isChangingLocale, setIsChangingLocale] = React.useState(false);
  const [error, setError] = React.useState(false);
  const requestId = React.useRef(0);

  const setCurrentLocale = React.useCallback(async (locale: string) => {
    if (!isSupportedLocale(locale)) throw new Error('Unsupported language');
    const id = ++requestId.current;
    setIsChangingLocale(true);
    try {
      const { messages, english, validation } = await loadLocale(locale);
      if (id !== requestId.current) return;
      await intl.init({
        currentLocale: locale,
        fallbackLocale: 'en',
        locales: { en: english, [locale]: messages },
      });
      if (id !== requestId.current) return;
      setLocale(validation);
      moment.locale(locale === 'ar' ? 'ar-ly' : 'en');
      setCookie('locale', locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      setLocaleState(locale);
      setIsReady(true);
      setError(false);
    } finally {
      if (id === requestId.current) setIsChangingLocale(false);
    }
  }, []);

  React.useEffect(() => {
    const locale = isSupportedLocale(initialLocale.current)
      ? initialLocale.current
      : 'en';
    setCurrentLocale(locale).catch(() => {
      setCurrentLocale('en').catch(() => setError(true));
    });
  }, [setCurrentLocale]);

  return (
    <AppIntlProvider
      currentLocale={currentLocale}
      isRTL={currentLocale === 'ar'}
      isChangingLocale={isChangingLocale}
      setCurrentLocale={setCurrentLocale}
    >
      {error && !isReady ? (
        <div role="alert">
          Unable to load translations. Please refresh to try again.
        </div>
      ) : null}
      {isReady ? children : null}
    </AppIntlProvider>
  );
}
