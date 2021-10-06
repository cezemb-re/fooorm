import formContext, {
  FormFields,
  FieldValidationFunction,
  FieldState,
  getDefaultFieldState,
  FormState,
  FormContext,
  FormErrors,
  FormSubmitError,
  isFormSubmitError,
  getDefaultFormState,
} from './state';
import Form, { FormProps } from './form';
import Field, { FieldComponentProps } from './field';

export {
  formContext,
  Form,
  Field,
  getDefaultFieldState,
  FormSubmitError,
  isFormSubmitError,
  getDefaultFormState,
};

export type {
  FormProps,
  FormFields,
  FieldValidationFunction,
  FieldState,
  FormState,
  FieldComponentProps,
  FormContext,
  FormErrors,
};

export default {
  formContext,
  Form,
  Field,
  getDefaultFieldState,
  FormSubmitError,
  isFormSubmitError,
  getDefaultFormState,
};
