import React from 'react';
import { Button } from '@blueprintjs/core';
import intl from 'react-intl-universal';
import { useAppIntlContext } from '@/components/AppIntlProvider';
import { useResponsiveNavigation } from '@/components/Dashboard/ResponsiveNavigation';
import { useSidebarSubmenu, useSidebarSubmnuActions } from '@/hooks/state';
import { SidebarOverlayBinded } from '../SidebarOverlay';
import { useMainSidebarMenu, useSubSidebarMenu } from './hooks';
import { ISidebarMenuItemType } from './interfaces';
import { SidebarContainer } from './SidebarContainer';
import { SidebarHead } from './SidebarHead';
import { SidebarMenu } from './SidebarMenu';

import '@/style/containers/Dashboard/Sidebar.scss';

/**
 * Dashboard sidebar.
 * @returns {JSX.Element}
 */
export function Sidebar({ compact = false }: { compact?: boolean }) {
  useAppIntlContext();
  const menu = useMainSidebarMenu();

  return (
    <SidebarContainer compact={compact}>
      <SidebarHead />

      <div className="sidebar__menu">
        {compact ? (
          <CompactSidebarMenu menu={menu} />
        ) : (
          <SidebarMenu menu={menu} />
        )}
      </div>
      {!compact && <SidebarOverlayBinded />}
      <SidebarFooterVersion />
    </SidebarContainer>
  );
}

function CompactSidebarMenu({
  menu,
}: React.ComponentProps<typeof SidebarMenu>) {
  const { isOpen, submenuId } = useSidebarSubmenu();
  const { closeSidebarSubmenu } = useSidebarSubmnuActions();
  const { closePanel } = useResponsiveNavigation();
  const submenu = useSubSidebarMenu(submenuId);
  const backButton = React.useRef<HTMLButtonElement>(null);
  const submenuTrigger = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (isOpen) backButton.current?.focus();
    else if (submenuTrigger.current) submenuTrigger.current.focus();
  }, [isOpen]);

  return (
    <nav aria-label={intl.get('menu')}>
      {isOpen && (
        <Button
          elementRef={backButton}
          className="compact-navigation__back"
          minimal
          onClick={closeSidebarSubmenu}
        >
          {intl.get('navigation.back_to_menu').d('Back to menu')}
        </Button>
      )}
      <ul hidden={isOpen} className="compact-navigation__list">
        {menu.map((item, index) => (
          <li key={index}>
            {item.type === ISidebarMenuItemType.Group ? (
              <span className="compact-navigation__group">{item.text}</span>
            ) : (
              <Button
                minimal
                aria-expanded={
                  item.type === ISidebarMenuItemType.Overlay
                    ? isOpen && item.overlayId === submenuId
                    : undefined
                }
                disabled={item.disabled}
                onClick={(event) => {
                  if (item.type === ISidebarMenuItemType.Overlay) {
                    submenuTrigger.current = event.currentTarget;
                  } else {
                    closePanel();
                  }
                  item.onClick?.(event);
                }}
              >
                {item.text}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {isOpen && (
        <ul className="compact-navigation__list">
          {submenu.map((item, index) => (
            <li key={index}>
              {item.type === ISidebarMenuItemType.Group ? (
                <span className="compact-navigation__group">{item.text}</span>
              ) : (
                <Button
                  minimal
                  disabled={item.disabled}
                  onClick={(event) => {
                    closePanel();
                    item.onClick?.(event);
                  }}
                >
                  {item.text}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

/**
 * Sidebar footer version.
 * @returns {React.JSX}
 */
function SidebarFooterVersion() {
  const { REACT_APP_VERSION } = process.env;

  if (!REACT_APP_VERSION) {
    return null;
  }
  return <div className="sidebar__version">v{REACT_APP_VERSION}</div>;
}
