import { Intent } from '@blueprintjs/core';
import { Formik, type FormikHelpers } from 'formik';
import * as FF from 'fp-ts/function';
import { pick } from 'lodash';
import React, { useState } from 'react';
import { InviteUserFormSchema } from './InviteUserDialog.schema';
import { InviteUserFormContent } from './InviteUserFormContent';
import { useInviteUserFormContext } from './InviteUserFormProvider';
import { transformApiErrors } from './utils';
import type { InviteUserFormValues } from './types';
import type { WithDialogActionsProps } from '@/containers/Dialog/withDialogActions';
import type { InviteUserBody, InviteUserResult } from '@bigcapital/sdk-ts';
import { InvitationAccessDetails } from './InvitationAccessDetails';
import { AppToaster } from '@/components';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';

const initialValues: InviteUserFormValues = {
  email: '',
  roleId: '',
};

interface InviteUserFormProps extends WithDialogActionsProps {}

function InviteUserFormInner({
  closeDialog,
}: InviteUserFormProps): React.ReactElement {
  const { dialogName, isEditMode, inviteUserMutate, userId } =
    useInviteUserFormContext();
  const [inviteResult, setInviteResult] = useState<InviteUserResult | null>(
    null,
  );

  const initialFormValues: InviteUserFormValues = {
    ...initialValues,
    status: 1,
    ...(isEditMode &&
      (pick(
        userId,
        Object.keys(InviteUserFormSchema.fields ?? {}),
      ) as Partial<InviteUserFormValues>)),
  };

  const handleSubmit = (
    values: InviteUserFormValues,
    { setSubmitting, setErrors }: FormikHelpers<InviteUserFormValues>,
  ) => {
    const form = { ...values };

    const onSuccess = (result: InviteUserResult) => {
      setSubmitting(false);
      setInviteResult(result);
    };

    // Handle the response error.
    const onError = (error: {
      data?: { errors?: Array<{ type: string }> };
    }) => {
      const errors = error?.data?.errors ?? [];

      const errorsTransformed = transformApiErrors(errors);

      setErrors({ ...errorsTransformed });
      setSubmitting(false);
      AppToaster.show({
        message:
          'Could not create the invitation. Check the details and try again.',
        intent: Intent.DANGER,
      });
    };
    // Form keeps `roleId: number | string` for Yup validation ergonomics; the
    // runtime value is a number when valid. Cast narrows to the SDK body shape.
    inviteUserMutate(form as InviteUserBody)
      .then(onSuccess)
      .catch(onError);
  };

  if (inviteResult) {
    return (
      <InvitationAccessDetails
        invitation={inviteResult.invitation}
        onClose={() => closeDialog(dialogName)}
      />
    );
  }

  return (
    <Formik
      validationSchema={InviteUserFormSchema}
      initialValues={initialFormValues}
      onSubmit={handleSubmit}
    >
      <InviteUserFormContent />
    </Formik>
  );
}
export const InviteUserForm = FF.pipe(InviteUserFormInner, withDialogActions);
