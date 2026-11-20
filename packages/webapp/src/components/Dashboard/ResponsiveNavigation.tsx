import { Button, Drawer, Position } from '@blueprintjs/core';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { useAppIntlContext } from '../AppIntlProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSidebarSubmnuActions } from '@/hooks/state';

// Keep this in sync with the responsive breakpoint in ResponsiveShell.scss.
const compactQuery = '(max-width: 1099.98px)';
type NavigationPanel = 'main' | 'preferences';

interface ResponsiveNavigationState {
  compact: boolean;
  panel: NavigationPanel | null;
  openPanel: (panel: NavigationPanel) => void;
  closePanel: () => void;
}

const ResponsiveNavigationContext =
  createContext<ResponsiveNavigationState | null>(null);

export function ResponsiveNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const compact = !!useMediaQuery(compactQuery, undefined, {
    getInitialValueInEffect: false,
  });
  const history = useHistory();
  const { closeSidebarSubmenu } = useSidebarSubmnuActions();
  const [panel, setPanel] = useState<NavigationPanel | null>(null);

  useEffect(() => history.listen(() => setPanel(null)), [history]);
  useEffect(() => {
    if (!compact) setPanel(null);
  }, [compact]);

  return (
    <ResponsiveNavigationContext.Provider
      value={{
        compact,
        panel,
        openPanel: (nextPanel) => {
          closeSidebarSubmenu();
          setPanel(nextPanel);
        },
        closePanel: () => {
          closeSidebarSubmenu();
          setPanel(null);
        },
      }}
    >
      {children}
    </ResponsiveNavigationContext.Provider>
  );
}

export function useResponsiveNavigation() {
  const context = useContext(ResponsiveNavigationContext);
  if (!context)
    throw new Error('Responsive navigation requires its dashboard provider.');
  return context;
}

export function ResponsiveNavigationDrawer({
  name,
  children,
}: {
  name: NavigationPanel;
  children: ReactNode;
}) {
  const { compact, panel, closePanel } = useResponsiveNavigation();
  const { currentLocale } = useAppIntlContext();
  const title = intl.get(name === 'main' ? 'menu' : 'preferences');
  const titleId = `compact-${name}-navigation-title`;

  return (
    <Drawer
      className={`compact-navigation compact-navigation--${name}`}
      isOpen={compact && panel === name}
      onClose={closePanel}
      position={currentLocale === 'ar' ? Position.RIGHT : Position.LEFT}
      size="min(320px, 90vw)"
    >
      <div
        className="compact-navigation__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="compact-navigation__heading">
          <h2 id={titleId}>{title}</h2>
          <Button
            minimal
            icon="cross"
            aria-label={intl.get('close')}
            onClick={closePanel}
          />
        </div>
        {children}
      </div>
    </Drawer>
  );
}
