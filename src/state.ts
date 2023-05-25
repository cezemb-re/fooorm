import { ChangeEvent, Context, createContext, SyntheticEvent, useContext } from 'react';

export type FieldModifierFunction<V> = (oldValue?: V) => V | undefined;

export type FieldModifier<V = unknown> =
  | V
  | ChangeEvent<{ value: V }>
  | FieldModifierFunction<V>
  | undefined;

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

export type FormErrors<FF extends FormFields = FormFields> = {
  [key in keyof FF]?: string;
} & { _global?: string };

export class FormSubmitError<FF extends FormFields = FormFields> extends Error {
  readonly __FLAG__: 'FormSubmitError';

  submitErrors: FormErrors<FF> | null;

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

export type FormValidationFunction<FF extends FormFields = FormFields> = (
  values: Partial<FF>,
) => FormErrors<FF> | Error | string | null | void;

export type FormSubmitFunction<FF extends FormFields = FormFields> = (
  values: FF,
  changes?: Partial<FF>,
) => unknown;

export type Fields<FF extends FormFields = FormFields> = { [key in keyof FF]?: FieldState };

export interface FormState<FF extends FormFields = FormFields> {
  hasChanged: boolean;
  isValid: boolean;
  isActive: boolean;
  visited: boolean;
  isSubmitting: boolean;
  submitCounter: number;
  submitSucceeded?: boolean;
  submitFailed?: boolean;
  values?: Partial<FF>;
  changes?: Partial<FF>;
  fields?: Fields<FF>;
  errors?: FormErrors<FF>;
  error?: string;
  warning?: string;
  warnings?: FormErrors<FF>;
}

export function getDefaultFormState<FF extends FormFields = FormFields>(): FormState<FF> {
  return {
    hasChanged: false,
    isValid: true,
    isSubmitting: false,
    isActive: false,
    visited: false,
    submitCounter: 0,
  };
}

export interface FormContext<FF extends FormFields = FormFields> {
  formState: FormState<FF>;
  mountField<F extends keyof FF>(
    name: keyof FF,
    initialValue?: FF[F],
    validateField?: FieldValidationFunction,
    warnField?: FieldValidationFunction,
  ): void;
  focusField(name: keyof FF): void;
  changeField<V = unknown>(
    name: keyof FF,
    modifier: FieldModifier<V>,
    onChange?: (value: V) => void,
  ): void;
  blurField(name: keyof FF): void;
  resetField(name: keyof FF): void;
  submitForm(event?: SyntheticEvent): unknown;
  resetForm(): void;
}

export const formContext = createContext<FormContext | undefined>(undefined);

export function useFormContext<FF extends FormFields = FormFields>(): FormContext<FF> {
  const context = useContext<FormContext<FF> | undefined>(
    formContext as Context<FormContext<FF> | undefined>,
  );
  if (!context) {
    throw new Error('Missing form context');
  }
  return context;
}
