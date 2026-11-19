import * as FF from 'fp-ts/function';
import { lazy } from 'react';
import { Drawer, DrawerSuspense } from '@/components';
import { withDrawers } from '@/containers/Drawer/withDrawers';

const QuickWriteVendorDrawerContent = lazy(() =>
  import('./QuickWriteVendorDrawerContent').then((m) => ({
    default: m.QuickWriteVendorDrawerContent,
  })),
);

interface QuickWriteVendorDrawerProps {
  name: string;
  isOpen: boolean;
  payload: { displayName?: string; autofillRef?: number };
}

/**
 * Quick Write vendor.
 */
function QuickWriteVendorDrawer({
  name,

  // #withDrawer
  isOpen,
  payload: { displayName, autofillRef },
}: QuickWriteVendorDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      name={name}
      className="master-record-drawer master-record-drawer--standard master-record-drawer--quick-create"
      size={'80%'}
    >
      <DrawerSuspense>
        <QuickWriteVendorDrawerContent
          displayName={displayName}
          autofillRef={autofillRef}
        />
      </DrawerSuspense>
    </Drawer>
  );
}

export const index = FF.pipe(QuickWriteVendorDrawer, withDrawers());
