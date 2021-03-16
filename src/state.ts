import { createContext, SyntheticEvent, useContext } from 'react';

export type FieldValidationFunction = (
  value: any
) => Error | string | null | void;

export interface FieldState<Value = any> {
  name?: string;
  validate?: FieldValidationFunction;
  warn?: FieldValidationFunction;
  initialValue: Value;
  value: Value;
  isTouched: boolean;
  isValid: boolean;
  isActive: boolean;
  visited: boolean;
  error: string | null;
  submitError: string | null;
  warning: string | null;
}

export const defaultFieldState: FieldState = {
  name: undefined,
  initialValue: undefined,
  value: undefined,
  isTouched: false,
  isValid: true,
  isActive: false,
  visited: false,
  error: null,
  submitError: null,
  warning: null,
};

export interface FormFields {
  [key: string]: any;
}

export type FormErrors<Fields extends FormFields = FormFields> = {
  [key in keyof Fields]?: string;
} & { _global?: string };

export class FormSubmitError<
  Fields extends FormFields = FormFields
> extends Error {
  formErrors: FormErrors<Fields> | null;

  constructor(errors: string | FormErrors) {
    super(typeof errors === 'string' ? errors : 'Unknown error');
    this.formErrors = typeof errors === 'string' ? { _global: errors } : errors;
  }
}

export type FormValidationFunction<Fields extends FormFields = FormFields> = (
  values: Fields
) => FormErrors<Fields>;

export type FormSubmitFunction<Fields extends FormFields = FormFields> = (
  values: Fields
) => Promise<any> | FormErrors | Error | string | null | void;

export interface FormState<Fields extends FormFields = FormFields> {
  nbFields: number;
  isTouched: boolean;
  isValid: boolean;
  isActive: boolean;
  visited: boolean;
  isSubmitting: boolean;
  submitSucceeded: boolean;
  submitFailed: boolean;
  submitCounter: number;
  values: Fields;
  fields: { [key in keyof Fields]: FieldState };
  errors: FormErrors<Fields>;
  submitErrors: FormErrors<Fields>;
  warnings: FormErrors<Fields>;
  onSubmit?: FormSubmitFunction<Fields>;
  validate?: FormValidationFunction<Fields>;
  warn?: FormValidationFunction<Fields>;
}

export const defaultFormState: FormState = {
  nbFields: 0,
  isTouched: false,
  isValid: false,
  isSubmitting: false,
  submitSucceeded: false,
  submitFailed: false,
  isActive: false,
  visited: false,
  submitCounter: 0,
  values: {},
  fields: {},
  errors: {},
  submitErrors: {},
  warnings: {},
};

export interface FormContext<Fields extends FormFields = FormFields> {
  formState: FormState<Fields>;
  mountField: (
    name: string,
    initialValue: any,
    validateField?: FieldValidationFunction,
    warnField?: FieldValidationFunction
  ) => void;
  focusField: (name: string) => void;
  changeField: (name: string, value: any) => void;
  blurField: (name: string) => void;
  resetField: (name: string) => void;
  submitForm: (event?: SyntheticEvent) => Promise<void> | boolean | void;
  resetForm: () => void;
}

const defaultContext: FormContext<any> = {
  formState: defaultFormState,
  mountField: () => undefined,
  focusField: () => undefined,
  changeField: () => undefined,
  blurField: () => undefined,
  resetField: () => undefined,
  submitForm: () => undefined,
  resetForm: () => undefined,
};

const formContext = createContext<FormContext<any>>(defaultContext);

export function useFormContext<
  Fields extends FormFields = FormFields
>(): FormContext<Fields> {
  return useContext<FormContext<Fields>>(formContext);
}

export default formContext;
