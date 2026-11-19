import React from 'react';
import { Switch, Route } from 'react-router-dom';
import '@/style/pages/Dashboard/Dashboard.scss';
import DashboardProvider from './DashboardProvider';
import { DashboardSockets } from './DashboardSockets';
import GlobalHotkeys from './GlobalHotkeys';
import {
  ResponsiveNavigationDrawer,
  ResponsiveNavigationProvider,
  useResponsiveNavigation,
} from './ResponsiveNavigation';
import DashboardContent from '@/components/Dashboard/DashboardContent';
import DashboardDocumentTitle from '@/components/Dashboard/DashboardDocumentTitle';
import DashboardSplitPane from '@/components/Dashboard/DashboardSplitePane';
import DialogsContainer from '@/components/DialogsContainer';
import DrawersContainer from '@/components/DrawersContainer';
import PreferencesPage from '@/components/Preferences/PreferencesPage';
import { AlertsContainer } from '@/containers/AlertsContainer';
import { Sidebar } from '@/containers/Dashboard/Sidebar/Sidebar';
import { DashboardUniversalSearch } from '@/containers/UniversalSearch/DashboardUniversalSearch';

/**
 * Dashboard preferences.
 */
function DashboardPreferences() {
  const { compact } = useResponsiveNavigation();

  return (
    <div className="dashboard-layout">
      <div className="dashboard-layout__main">
        <DashboardSplitPane>
          {compact ? <div aria-hidden /> : <Sidebar />}
          <PreferencesPage />
        </DashboardSplitPane>
      </div>
    </div>
  );
}

/**
 * Dashboard other routes.
 */
function DashboardAnyPage() {
  const { compact } = useResponsiveNavigation();

  return (
    <div className="dashboard-layout">
      <div className="dashboard-layout__main">
        <DashboardSplitPane>
          {compact ? <div aria-hidden /> : <Sidebar />}
          <DashboardContent />
        </DashboardSplitPane>
      </div>
    </div>
  );
}

/**
 * Dashboard page.
 */
export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardDocumentTitle />

      <ResponsiveNavigationProvider>
        <Switch>
          <Route path="/preferences" component={DashboardPreferences} />
          <Route path="/" component={DashboardAnyPage} />
        </Switch>
        <ResponsiveNavigationDrawer name="main">
          <Sidebar compact />
        </ResponsiveNavigationDrawer>
      </ResponsiveNavigationProvider>

      <DashboardSockets />
      <DashboardUniversalSearch />
      <GlobalHotkeys />
      <DialogsContainer />
      <DrawersContainer />
      <AlertsContainer />
    </DashboardProvider>
  );
}
