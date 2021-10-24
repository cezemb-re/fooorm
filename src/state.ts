import { Context, createContext, SyntheticEvent, useContext } from 'react';

export type FieldValidationFunction = (value: unknown) => Error | string | null | void;

export interface FieldState<V = unknown> {
  name?: string;
  hasChanged: boolean;
  isValid: boolean;
  isActive: boolean;
  visited: boolean;
  submitted: boolean;
  initialValue?: V;
  value?: V;
  error?: string;
  warning?: string;
}

export function getDefaultFieldState<V = unknown>(): FieldState<V> {
  return {
    hasChanged: false,
    isValid: true,
    isActive: false,
    visited: false,
    submitted: false,
  };
}

export interface FormFields {
  [key: string]: unknown;
}

export type FormErrors<F extends FormFields = FormFields> = {
  [key in keyof F]?: string;
} & { _global?: string };

export class FormSubmitError<F extends FormFields = FormFields> extends Error {
  __FLAG__: 'FormSubmitError';

  submitErrors: FormErrors<F> | null;

  constructor(errors: string | FormErrors) {
    super(typeof errors === 'string' ? errors : 'Unknown error');
    this.submitErrors = typeof errors === 'string' ? { _global: errors } : errors;
    this.__FLAG__ = 'FormSubmitError';
  }
}

export function isFormSubmitError(error: unknown): boolean {
  return !!(
    error &&
    typeof error === 'object' &&
    '__FLAG__' in error &&
    error instanceof FormSubmitError &&
    error.__FLAG__ &&
    error.__FLAG__ === 'FormSubmitError'
  );
}

export type FormValidationFunction<F extends FormFields = FormFields> = (
  values: Partial<F>,
) => FormErrors<F> | Error | string | null | void;

export type FormSubmitFunction<F extends FormFields = FormFields> = (
  values: F,
  changes?: Partial<F>,
) => Promise<unknown> | FormErrors | Error | string | null | void;

export type Fields<F extends FormFields = FormFields> = { [key in keyof F]?: FieldState };

export interface FormState<F extends FormFields = FormFields> {
  hasChanged: boolean;
  isValid: boolean;
  isActive: boolean;
  visited: boolean;
  isSubmitting: boolean;
  submitCounter: number;
  submitSucceeded?: boolean;
  submitFailed?: boolean;
  liveValidation?: boolean;
  values?: Partial<F>;
  changes?: Partial<F>;
  fields?: Fields<F>;
  errors?: FormErrors<F>;
  error?: string;
  warning?: string;
  warnings?: FormErrors<F>;
  onSubmit?: FormSubmitFunction<F>;
  onChange?: FormSubmitFunction<F>;
  validate?: FormValidationFunction<F>;
  warn?: FormValidationFunction<F>;
}

export function getDefaultFormState<F extends FormFields = FormFields>(): FormState<F> {
  return {
    hasChanged: false,
    isValid: true,
    isSubmitting: false,
    isActive: false,
    visited: false,
    submitCounter: 0,
  };
}

export interface FormContext<F extends FormFields = FormFields, V = unknown> {
  formState: FormState<F>;
  mountField?: (
    name: keyof F,
    initialValue: V,
    validateField?: FieldValidationFunction,
    warnField?: FieldValidationFunction,
  ) => void;
  focusField?: (name: keyof F) => void;
  changeField?: (name: keyof F, value: V) => void;
  blurField?: (name: keyof F) => void;
  resetField?: (name: keyof F) => void;
  submitForm?: (event?: SyntheticEvent) => Promise<void> | boolean | void;
  resetForm?: () => void;
}

export function getDefaultContext<F extends FormFields = FormFields>(): FormContext<F> {
  return {
    formState: getDefaultFormState<F>(),
  };
}

const formContext = createContext<FormContext>(getDefaultContext());

export function useFormContext<F extends FormFields = FormFields, V = unknown>(): FormContext<
  F,
  V
> {
  return useContext<FormContext<F, V>>(formContext as Context<FormContext<F, V>>);
}

export default formContext;
