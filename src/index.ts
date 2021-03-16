import formContext, {
  FormFields,
  FieldValidationFunction,
  FieldState,
  defaultFieldState,
  FormState,
  defaultFormState,
  FormContext,
  useFormContext,
  FormErrors,
  FormSubmitError,
  isFormSubmitError,
} from './state';
import Form from './form';
import Field, { FieldComponentProps } from './field';

export {
  Form,
  Field,
  useFormContext,
  formContext,
  defaultFieldState,
  defaultFormState,
  FormSubmitError,
  isFormSubmitError,
};

export type {
  FormFields,
  FieldValidationFunction,
  FieldState,
  FormState,
  FieldComponentProps,
  FormContext,
  FormErrors,
};

export default {
  Form,
  Field,
  useFormContext,
  formContext,
  defaultFieldState,
  defaultFormState,
  FormSubmitError,
  isFormSubmitError,
};
