import clsx from 'classnames';
import React, { forwardRef } from 'react';
import { Box, BoxProps } from '../../Layout';
import styles from './AppContentShell.module.scss';
import {
  AppShellProvider,
  useAppShellContext,
} from './AppContentShellProvider';

interface AppContentShellProps {
  topbarOffset?: number;
  className?: string;
  mainProps?: BoxProps;
  asideProps?: BoxProps;
  children: React.ReactNode;
  hideAside?: boolean;
  hideMain?: boolean;
}

const AppContentShellComponent = forwardRef<
  HTMLDivElement,
  AppContentShellProps
>(
  (
    {
      asideProps,
      mainProps,
      topbarOffset = 0,
      hideAside = false,
      hideMain = false,
      className,
      ...restProps
    },
    ref,
  ) => {
    return (
      <AppShellProvider
        mainProps={mainProps}
        asideProps={asideProps}
        topbarOffset={topbarOffset}
        hideAside={hideAside}
        hideMain={hideMain}
      >
        <Box
          {...restProps}
          className={clsx(styles.root, className)}
          ref={ref}
        />
      </AppShellProvider>
    );
  },
);
AppContentShellComponent.displayName = 'AppContentShell';

interface AppContentShellMainProps extends BoxProps {}

/**
 * Main content of the app shell.
 */
const AppContentShellMain = forwardRef<
  HTMLDivElement,
  AppContentShellMainProps
>((props, ref) => {
  const { hideMain } = useAppShellContext();

  if (hideMain === true) {
    return null;
  }
  return <Box {...props} className={styles.main} ref={ref} />;
});

AppContentShellMain.displayName = 'AppContentShellMain';

interface AppContentShellAsideProps extends BoxProps {
  children: React.ReactNode;
}

/**
 * Aside content of the app shell.
 */
const AppContentShellAside = forwardRef<
  HTMLDivElement,
  AppContentShellAsideProps
>((props, ref) => {
  const { hideAside } = useAppShellContext();

  if (hideAside === true) {
    return null;
  }
  return (
    <Box {...props} className={clsx(styles.aside, props.className)} ref={ref} />
  );
});
AppContentShellAside.displayName = 'AppContentShellAside';

export const AppContentShell = Object.assign(AppContentShellComponent, {
  Main: AppContentShellMain,
  Aside: AppContentShellAside,
});
