import { Spinner } from '@blueprintjs/core';
import { Suspense } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { AuthContainer } from './AuthContainer';
import { AuthMetaBootProvider } from './AuthMetaBoot';
import { Box } from '@/components';
import authenticationRoutes from '@/routes/authentication';

export function Authentication() {
  return (
    <AuthContainer>
      <AuthMetaBootProvider>
        <Suspense
          fallback={
            <Box style={{ marginTop: '5rem' }}>
              <Spinner size={30} />
            </Box>
          }
        >
          <AuthenticationRoutes />
        </Suspense>
      </AuthMetaBootProvider>
    </AuthContainer>
  );
}

function AuthenticationRoutes() {
  const location = useLocation();
  const locationKey = location.pathname;

  return (
    <TransitionGroup>
      <CSSTransition
        timeout={500}
        key={locationKey}
        classNames="authTransition"
      >
        <Switch>
          {authenticationRoutes.map((route, index) => (
            <Route key={index} path={route.path} component={route.component} />
          ))}
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  );
}
