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

export type FormErrors<F = unknown> = {
  [key in keyof F]?: string;
} & { _global?: string };

export class FormSubmitError<F = unknown> extends Error {
  readonly __FLAG__: 'FormSubmitError';

  submitErrors: FormErrors<F> | null;

  constructor(errors: string | FormErrors<F>) {
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

export type FormValidationFunction<F = unknown> = (
  values: Partial<F>,
) => FormErrors<F> | Error | string | null | void;

export type FormSubmitFunction<F = unknown> = (values: F, changes?: Partial<F>) => unknown;

export type Fields<F = unknown> = { [key in keyof F]?: FieldState };

export interface FormState<F = unknown> {
  hasChanged: boolean;
  isValid: boolean;
  isActive: boolean;
  visited: boolean;
  isSubmitting: boolean;
  submitCounter: number;
  submitSucceeded?: boolean;
  submitFailed?: boolean;
  values?: Partial<F>;
  changes?: Partial<F>;
  fields?: Fields<F>;
  errors?: FormErrors<F>;
  error?: string;
  warning?: string;
  warnings?: FormErrors<F>;
}

export function getDefaultFormState<F = unknown>(): FormState<F> {
  return {
    hasChanged: false,
    isValid: true,
    isSubmitting: false,
    isActive: false,
    visited: false,
    submitCounter: 0,
  };
}

export interface FormContext<F = unknown> {
  formState: FormState<F>;
  mountField<N extends keyof F>(
    name: keyof F,
    initialValue?: F[N],
    validateField?: FieldValidationFunction,
    warnField?: FieldValidationFunction,
  ): void;
  focusField(name: keyof F): void;
  changeField<V = unknown>(
    name: keyof F,
    modifier: FieldModifier<V>,
    onChange?: (value: V) => void,
  ): void;
  blurField(name: keyof F): void;
  resetField(name: keyof F): void;
  submitForm(event?: SyntheticEvent): unknown;
  resetForm(): void;
}

export const formContext = createContext<FormContext | undefined>(undefined);

export function useFormContext<F = unknown>(): FormContext<F> {
  const context = useContext<FormContext<F> | undefined>(
    formContext as Context<FormContext<F> | undefined>,
  );
  if (!context) {
    throw new Error('Missing form context');
  }
  return context;
}
