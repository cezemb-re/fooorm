import formContext, {
  FormFields,
  FieldValidationFunction,
  FieldState,
  getDefaultFieldState,
  FormState,
  FormContext,
  FormSubmitFunction,
  FormValidationFunction,
  FormErrors,
  FormSubmitError,
  isFormSubmitError,
  getDefaultFormState,
  Fields,
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
  FormSubmitFunction,
  FormValidationFunction,
  FormErrors,
  Fields,
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
