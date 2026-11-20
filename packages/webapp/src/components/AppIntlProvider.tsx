import React, { createContext } from 'react';

interface AppIntlContextValue {
  currentLocale: string;
  direction: 'rtl' | 'ltr';
  isRTL: boolean;
  isLTR: boolean;
  isChangingLocale: boolean;
  setCurrentLocale: (locale: string) => Promise<void>;
}

const AppIntlContext = createContext<AppIntlContextValue>(
  {} as AppIntlContextValue,
);

interface AppIntlProviderProps {
  currentLocale: string;
  isRTL: boolean;
  children: React.ReactNode;
  isChangingLocale: boolean;
  setCurrentLocale: (locale: string) => Promise<void>;
}

/**
 * Application intl provider.
 */
function AppIntlProvider({
  currentLocale,
  isRTL,
  children,
  isChangingLocale,
  setCurrentLocale,
}: AppIntlProviderProps) {
  const provider: AppIntlContextValue = {
    currentLocale,
    isRTL,
    isLTR: !isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    isChangingLocale,
    setCurrentLocale,
  };

  return (
    <AppIntlContext.Provider value={provider}>
      {children}
    </AppIntlContext.Provider>
  );
}

const useAppIntlContext = () =>
  React.useContext<AppIntlContextValue>(AppIntlContext);

export { AppIntlProvider, useAppIntlContext };
