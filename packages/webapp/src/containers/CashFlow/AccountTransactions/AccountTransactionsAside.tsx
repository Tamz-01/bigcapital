import { Spinner } from '@blueprintjs/core';
import { Suspense, lazy, useEffect, useRef } from 'react';
import { AppContentShell } from '@/components/AppShell';
import { useAppShellContext } from '@/components/AppShell/AppContentShell/AppContentShellProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const CategorizeTransactionAside = lazy(() =>
  import('../CategorizeTransactionAside/CategorizeTransactionAside').then(
    (module) => ({ default: module.CategorizeTransactionAside }),
  ),
);

export function AccountTransactionsAside() {
  const aside = useRef<HTMLDivElement>(null);
  const { hideAside } = useAppShellContext();
  const compact = useMediaQuery('(max-width: 767.98px)');

  useEffect(() => {
    if (hideAside || !compact) return;

    const previousFocus = document.activeElement;
    aside.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [compact, hideAside]);

  return (
    <AppContentShell.Aside
      className="bank-matching-aside"
      aria-label="Bank transaction matching"
      role="region"
      ref={aside}
      tabIndex={-1}
    >
      <Suspense fallback={<Spinner size={20} />}>
        <CategorizeTransactionAside />
      </Suspense>
    </AppContentShell.Aside>
  );
}
