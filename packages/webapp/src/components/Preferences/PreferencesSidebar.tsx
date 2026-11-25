// @ts-nocheck
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PreferencesSidebarContainer from './PreferencesSidebarContainer';
import { FormattedMessage as T } from '@/components';
import { PreferencesMenu } from '@/constants/preferencesMenu';
import { useFeatureCan } from '@/hooks/state/feature';

import '@/style/pages/Preferences/Sidebar.scss';

/**
 * Preferences sidebar.
 */
export default function PreferencesSidebar({ compact = false }) {
  const history = useHistory();
  const location = useLocation();
  const { featureCan } = useFeatureCan();

  const items = PreferencesMenu.filter((item) => {
    if (item.feature && !featureCan(item.feature)) {
      return false;
    }
    return true;
  }).map((item) =>
    item.divider ? (
      <MenuDivider key={item.title} title={item.title} />
    ) : (
      <MenuItem
        key={item.href}
        tagName={compact ? 'button' : 'a'}
        active={item.href && item.href === location.pathname}
        text={item.text}
        label={item.label}
        disabled={item.disabled}
        onClick={() => {
          history.push(item.href);
        }}
      />
    ),
  );

  return (
    <PreferencesSidebarContainer>
      {!compact && (
        <div className="preferences-sidebar__head">
          <h2>
            <T id={'preferences'} />
          </h2>
        </div>
      )}

      <Menu className="preferences-sidebar__menu">{items}</Menu>
    </PreferencesSidebarContainer>
  );
}
