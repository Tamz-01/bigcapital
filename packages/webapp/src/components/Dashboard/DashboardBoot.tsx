import React, { useEffect } from 'react';
import { useWatch, useWatchImmediate, useWhen } from '@/hooks';
import {
  useAuthenticatedAccount,
  useCurrentOrganization,
  useDashboardMeta,
} from '@/hooks/query';
import { useSplashLoading } from '@/hooks/state';
import { useAppIntlContext } from '../AppIntlProvider';
import { resolveAccountLocale } from '@/constants/locales';

/**
 * Dashboard meta async booting.
 *  - Fetches the dashboard meta in booting state.
 *  - Once the dashboard meta query started loading display dashboard splash screen.
 */
export function useDashboardMetaBoot() {
  const {
    data: dashboardMeta,
    isLoading: isDashboardMetaLoading,
    isSuccess: isDashboardMetaSuccess,
  } = useDashboardMeta();
  const [startLoading, stopLoading] = useSplashLoading();

  useWatchImmediate((value) => {
    value && startLoading();
  }, isDashboardMetaLoading);

  useWatchImmediate(() => {
    isDashboardMetaSuccess && stopLoading();
  }, isDashboardMetaSuccess);

  return {
    meta: dashboardMeta,
    isLoading: isDashboardMetaLoading,
    isSuccess: isDashboardMetaSuccess,
  };
}

/**
 * Application async booting.
 */
export function useApplicationBoot() {
  // Fetches the current user's organization.
  const {
    isSuccess: isCurrentOrganizationSuccess,
    isLoading: isOrgLoading,
    data: organization,
  } = useCurrentOrganization();

  // Authenticated user.
  const {
    isSuccess: isAuthUserSuccess,
    isLoading: isAuthUserLoading,
    data: account,
  } = useAuthenticatedAccount();
  const { currentLocale, setCurrentLocale } = useAppIntlContext();

  // Is the dashboard booted.
  const isBooted = React.useRef(false);

  // The account choice wins; the company language is only a default.
  React.useEffect(() => {
    if (isAuthUserSuccess && isCurrentOrganizationSuccess) {
      const locale = resolveAccountLocale(
        account.language,
        organization?.metadata?.language,
      );
      if (locale !== currentLocale) {
        setCurrentLocale(locale).catch(() => {
          // Keep the existing language and page usable if a bundle cannot load.
        });
      }
    }
  }, [
    account.language,
    organization?.metadata?.language,
    isAuthUserSuccess,
    isCurrentOrganizationSuccess,
    currentLocale,
    setCurrentLocale,
  ]);

  const [startLoading, stopLoading] = useSplashLoading();

  // Splash loading when organization request loading and
  // application still not booted.
  useWatchImmediate((value) => {
    value && !isBooted.current && startLoading();
  }, isOrgLoading);

  // Splash loading when request authenticated user loading and
  // application still not booted yet.
  useWatchImmediate((value) => {
    value && !isBooted.current && startLoading();
  }, isAuthUserLoading);

  // Stop splash loading once organization request success.
  useWatch((value) => {
    value && stopLoading();
  }, isCurrentOrganizationSuccess);

  // Stop splash loading once authenticated user request success.
  useWatch((value) => {
    value && stopLoading();
  }, isAuthUserSuccess);

  // Once the all requests complete change the app loading state.
  useWhen(isAuthUserSuccess && isCurrentOrganizationSuccess, () => {
    isBooted.current = true;
  });
  // Reset the loading states once the hook unmount.
  useEffect(
    () => () => {
      isAuthUserLoading && !isBooted.current && stopLoading();
      isOrgLoading && !isBooted.current && stopLoading();
    },
    [isAuthUserLoading, isOrgLoading, stopLoading],
  );

  return {
    isLoading: isOrgLoading || isAuthUserLoading,
  };
}
