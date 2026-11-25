import { Intent } from '@blueprintjs/core';
import { Formik, type FormikHelpers } from 'formik';
import * as FF from 'fp-ts/function';
import { ExportDialogFormSchema } from './ExportDialogForm.schema';
import { ExportDialogFormContent } from './ExportDialogFormContent';
import type { ExportFormInitialValues } from './type';
import type { WithDialogActionsProps } from '@/containers/Dialog/withDialogActions';
import { AppToaster } from '@/components';
import { DialogsName } from '@/constants/dialogs';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { useResourceExport } from '@/hooks/query/FinancialReports/use-export';

interface ExportDialogFormValues {
  resource: string;
  format: string;
}

interface ExportDialogFormProps extends WithDialogActionsProps {
  initialValues?: ExportFormInitialValues;
}

/**
 * Account form dialog content.
 */
function ExportDialogFormRoot({
  // #ownProps
  initialValues,
  closeDialog,
}: ExportDialogFormProps): React.ReactElement {
  const { mutateAsync: mutateExport } = useResourceExport();

  // Callbacks handles form submit.
  const handleFormSubmit = (
    values: ExportDialogFormValues,
    { setSubmitting }: FormikHelpers<ExportDialogFormValues>,
  ) => {
    setSubmitting(true);
    const { resource, format } = values;

    mutateExport({ resource, format })
      .then(() => {
        setSubmitting(false);
        closeDialog(DialogsName.Export);
      })
      .catch(() => {
        setSubmitting(false);
        AppToaster.show({
          intent: Intent.DANGER,
          message: 'Something went wrong!',
        });
      });
  };

  // Form initial values in create and edit mode.
  const initialFormValues: ExportDialogFormValues = {
    resource: initialValues?.resource ?? '',
    format: initialValues?.format ?? 'csv',
  };
  return (
    <Formik
      validationSchema={ExportDialogFormSchema}
      initialValues={initialFormValues}
      onSubmit={handleFormSubmit}
    >
      <ExportDialogFormContent />
    </Formik>
  );
}

export const ExportDialogForm = FF.pipe(
  ExportDialogFormRoot,
  withDialogActions,
);
