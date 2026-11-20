import type { InviteUserResult } from '@bigcapital/sdk-ts';
import { InvitationAccessDetails } from '@/containers/Dialogs/InviteUserDialog/InvitationAccessDetails';
import { Dialog, Intent } from '@blueprintjs/core';
import * as FF from 'fp-ts/function';
import React, { useCallback, useState } from 'react';
import { ActionsMenu, useUsersListColumns } from './components';
import { useUsersListContext } from './UsersProvider';
import type { WithAlertActionsProps } from '@/containers/Alert/withAlertActions';
import type { WithDialogActionsProps } from '@/containers/Dialog/withDialogActions';
import { DataTable, TableSkeletonRows, AppToaster } from '@/components';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { useResendInvitation } from '@/hooks/query';

// See components.tsx — UserRow widens the SDK User with legacy property names.
type UserRow = {
  id: number;
  email: string;
  inviteAcceptedAt?: string;
  fullName?: string;
};

type UsersDataTableInnerProps = Pick<WithDialogActionsProps, 'openDialog'> &
  Pick<WithAlertActionsProps, 'openAlert'>;

interface ResendInvitationError {
  data: { errors: Array<{ type: string }> };
}

/**
 * Users datatable.
 */
function UsersDataTableInner({
  // #withDialogActions
  openDialog,

  // #withAlertActions
  openAlert,
}: UsersDataTableInnerProps) {
  const { mutateAsync: resendInviation } = useResendInvitation();
  const [inviteResult, setInviteResult] = useState<InviteUserResult | null>(
    null,
  );

  // Users list columns.
  const columns = useUsersListColumns();

  // Users list context.
  const { users, isUsersLoading, isUsersFetching } = useUsersListContext();

  // Handle edit user action.
  const handleEditUserAction = useCallback(
    (user: UserRow) => {
      openDialog('user-form', { action: 'edit', userId: user.id });
    },
    [openDialog],
  );
  // Handle inactivate user action.
  const handleInactivateUser = useCallback(
    (user: UserRow) => {
      openAlert('user-inactivate', { userId: user.id });
    },
    [openAlert],
  );
  // Handle activate user action.
  const handleActivateuser = useCallback(
    (user: UserRow) => {
      openAlert('user-activate', { userId: user.id });
    },
    [openAlert],
  );
  // Handle delete user action.
  const handleDeleteUser = useCallback(
    (user: UserRow) => {
      openAlert('user-delete', { userId: user.id });
    },
    [openAlert],
  );
  const handleResendInvitation = useCallback(
    (user: UserRow) => {
      resendInviation(user.id)
        .then(setInviteResult)
        .catch((err: ResendInvitationError) => {
          const errors = err?.data?.errors ?? [];
          if (errors.find((e) => e.type === 'USER_RECENTLY_INVITED')) {
            AppToaster.show({
              message:
                'This person was recently invited. No need to invite them again just yet.',
              intent: Intent.WARNING,
            });
          }
        });
    },
    [resendInviation],
  );

  return (
    <>
      <Dialog
        isOpen={!!inviteResult}
        title="Invitation details"
        onClose={() => setInviteResult(null)}
      >
        {inviteResult && (
          <InvitationAccessDetails
            invitation={inviteResult.invitation}
            onClose={() => setInviteResult(null)}
          />
        )}
      </Dialog>
      <DataTable
        columns={columns}
        data={users ?? []}
        loading={isUsersLoading}
        headerLoading={isUsersLoading}
        progressBarLoading={isUsersFetching}
        TableLoadingRenderer={TableSkeletonRows}
        noInitialFetch={true}
        ContextMenu={ActionsMenu}
        payload={{
          onEdit: handleEditUserAction,
          onActivate: handleActivateuser,
          onInactivate: handleInactivateUser,
          onDelete: handleDeleteUser,
          onResendInvitation: handleResendInvitation,
        }}
      />
    </>
  );
}

export const UsersDataTable = FF.pipe(
  UsersDataTableInner,
  withAlertActions,
  withDialogActions,
);
