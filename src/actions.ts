import isEqual from 'lodash.isequal';
import {
  FieldValidationFunction,
  FormValidationFunction,
  FormState,
  FormFields,
  defaultFieldState,
  FormErrors,
  FormSubmitError,
} from './state';

function parseError(error: Error | string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return error;
}

function validateField<Value = any>(
  value: Value,
  validate: FieldValidationFunction | undefined
): string | null {
  if (!validate || typeof validate !== 'function') {
    return null;
  }
  try {
    const error = validate(value);
    if (error) {
      return parseError(error);
    }
  } catch (error) {
    return parseError(error);
  }
  return null;
}

function validateFormFields<Fields extends FormFields = FormFields>(
  values: Fields,
  validate: FormValidationFunction<Fields>
): FormErrors<Fields> {
  try {
    const errors = validate(values);

    if (!errors) {
      return {};
    }
    if (typeof errors === 'string') {
      return { _global: errors };
    }
    if (errors instanceof Error) {
      return { _global: errors.message };
    }

    return errors;
  } catch (error) {
    return { _global: parseError(error) };
  }
}
function validateForm<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
): FormState<Fields> {
  const nextState: FormState<Fields> = {
    ...formState,
    errors: {},
    error: null,
    warnings: {},
    warning: null,
    isValid: true,
  };

  Object.keys(formState.fields).forEach((field: keyof Fields) => {
    if (formState.fields[field].error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.errors[field] = formState.fields[field].error;
    }
    if (formState.fields[field].warning) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.warnings[field] = formState.fields[field].warning;
    }
  });

  if (formState.validate) {
    const errors = validateFormFields<Fields>(
      formState.values,
      formState.validate
    );

    Object.keys(errors).forEach((field: keyof Fields) => {
      if (field in errors && errors[field]) {
        nextState.errors[field] = errors[field];

        if (field === '_global' && errors._global) {
          nextState.error = errors._global;
        } else if (field in nextState.fields) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          nextState.fields[field].error = errors[field];
        }
      }
    });
  }

  if (formState.warn) {
    const warnings = validateFormFields<Fields>(
      formState.values,
      formState.warn
    );

    Object.keys(warnings).forEach((field: keyof Fields) => {
      if (field in warnings && warnings[field]) {
        nextState.warnings[field] = warnings[field];

        if (field === '_global' && warnings._global) {
          nextState.warning = warnings._global;
        } else if (field in nextState.fields) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          nextState.fields[field].warning = warnings[field];
        }
      }
    });
  }

  if (Object.keys(nextState.errors).length) {
    nextState.isValid = false;
  }

  return nextState;
}

export function mountFieldAction<
  Value = any,
  Fields extends FormFields = FormFields
>(
  { nbFields, fields, values, ...formState }: FormState<Fields>,
  name: string,
  initialValue: Value,
  validate: FieldValidationFunction | undefined,
  warn: FieldValidationFunction | undefined
): FormState<Fields> {
  let value: Value;
  let isTouched = false;

  if (name in fields && isEqual(fields[name].initialValue, initialValue)) {
    value = fields[name].value;
    isTouched = fields[name].isTouched;
  } else {
    value = initialValue;
  }

  const nextState = {
    ...formState,
    nbFields: name in fields ? nbFields : nbFields + 1,
    fields: {
      ...fields,
      [name]: {
        ...defaultFieldState,
        name,
        initialValue,
        value,
        isTouched,
        validate,
        warn,
      },
    },
    values: {
      ...values,
      [name]: initialValue,
    },
  };

  if (validate) {
    nextState.fields[name].error = validateField(value, validate);
    if (nextState.fields[name].error) {
      nextState.fields[name].isValid = false;
    }
  }

  if (warn) {
    nextState.fields[name].warning = validateField(value, warn);
  }

  return validateForm(nextState);
}

export function focusFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: string
): FormState<Fields> {
  if (!(name in fields) || !fields[name]) {
    throw new Error('Field not found');
  }
  return {
    ...formState,
    isActive: true,
    visited: true,
    fields: {
      ...fields,
      [name]: { ...fields[name], isActive: true, visited: true },
    },
  };
}

export function changeFieldAction<
  Value = any,
  Fields extends FormFields = FormFields
>(
  { fields, values, ...formState }: FormState<Fields>,
  name: string,
  value: Value
): FormState<Fields> {
  if (!(name in fields) || !fields[name]) {
    throw new Error('Field not found');
  }
  const nextState = {
    ...formState,
    isTouched: true,
    fields: {
      ...fields,
      [name]: { ...fields[name], isTouched: true, value },
    },
    values: {
      ...values,
      [name]: value,
    },
  };

  if ('validate' in fields[name] && fields[name].validate) {
    nextState.fields[name].error = validateField(value, fields[name].validate);
    if (nextState.fields[name].error) {
      nextState.fields[name].isValid = false;
    }
  }

  if ('warn' in fields[name] && fields[name].warn) {
    nextState.fields[name].warning = validateField(value, fields[name].warn);
  }

  return validateForm(nextState);
}

export function blurFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: string
): FormState<Fields> {
  if (!(name in fields) || !fields[name]) {
    throw new Error('Field not found');
  }
  return {
    ...formState,
    isActive: false,
    fields: {
      ...fields,
      [name]: { ...fields[name], isActive: false },
    },
  };
}

export function resetFieldAction<Fields extends FormFields = FormFields>(
  { fields, values, ...formState }: FormState<Fields>,
  name: string
): FormState<Fields> {
  if (!(name in fields) || !fields[name]) {
    throw new Error('Field not found');
  }
  const nextState: FormState<Fields> = {
    ...formState,
    fields: {
      ...fields,
      [name]: {
        ...fields[name],
        isTouched: false,
        isValid: true,
        value: fields[name].initialValue,
        error: null,
        warning: null,
        submitError: null,
      },
    },
    values: {
      ...values,
      [name]: fields[name].initialValue,
    },
  };

  if ('validate' in fields[name] && fields[name].validate) {
    nextState.fields[name].error = validateField(
      fields[name].initialValue,
      fields[name].validate
    );
    if (nextState.fields[name].error) {
      nextState.fields[name].isValid = false;
    }
  }

  if ('warn' in fields[name] && fields[name].warn) {
    nextState.fields[name].warning = validateField(
      fields[name].initialValue,
      fields[name].warn
    );
  }

  return validateForm<Fields>(nextState);
}

export function resetFormAction<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
): FormState<Fields> {
  const nextState: FormState<Fields> = {
    ...formState,
    submitCounter: 0,
    isTouched: false,
    isSubmitting: false,
    isValid: true,
    submitSucceeded: false,
    submitFailed: false,
    warnings: {},
    errors: {},
    submitErrors: {},
  };

  Object.keys(nextState.fields).forEach((name: keyof Fields) => {
    nextState.fields[name] = {
      ...formState.fields[name],
      isTouched: false,
      isValid: true,
      initialValue: formState.fields[name].initialValue,
      value: formState.fields[name].initialValue,
      error: null,
      warning: null,
      submitError: null,
    };

    if (formState.fields[name].validate) {
      nextState.fields[name].error = validateField(
        formState.fields[name].initialValue,
        formState.fields[name].validate
      );
      if (nextState.fields[name].error) {
        nextState.fields[name].isValid = false;
      }
    }

    if (formState.fields[name].warn) {
      nextState.fields[name].warning = validateField(
        formState.fields[name].initialValue,
        formState.fields[name].warn
      );
    }

    nextState.values[name] = formState.fields[name].initialValue;
  });

  return validateForm<Fields>(nextState);
}

export function startSubmitAction<Fields extends FormFields = FormFields>({
  submitCounter,
  ...formState
}: FormState<Fields>): FormState<Fields> {
  const nextState = {
    ...formState,
    submitErrors: {},
    submitError: null,
    isSubmitting: true,
    submitSucceeded: false,
    submitFailed: false,
    submitCounter: submitCounter + 1,
  };

  Object.keys(formState.fields).forEach((name: keyof Fields) => {
    nextState.fields[name].submitError = null;
  });

  return nextState;
}

function parseSubmitErrors<Fields extends FormFields = FormFields>(
  errors: FormSubmitError | FormErrors | Error | string
): FormErrors<Fields> {
  if (!errors) {
    return {};
  }
  if (
    typeof errors === 'object' &&
    'submitErrors' in errors &&
    errors.submitErrors
  ) {
    return errors.submitErrors as FormErrors<Fields>;
  }
  if (errors instanceof Error && errors) {
    return { _global: errors.message };
  }
  if (typeof errors === 'string') {
    return { _global: errors };
  }
  if (typeof errors === 'object' && errors) {
    return errors as FormErrors<Fields>;
  }
  return { _global: 'Unknown error' };
}

export async function submitAction<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
): Promise<FormState<Fields>> {
  if (!formState.onSubmit) {
    return {
      ...formState,
      isSubmitting: false,
      submitFailed: true,
      submitErrors: { _global: 'No submit Handler' },
      submitError: 'No submit Handler',
    };
  }

  const result = formState.onSubmit(formState.values);

  if (result instanceof Promise) {
    await result;
  } else if (result) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw result;
  }

  return {
    ...formState,
    isSubmitting: false,
    submitSucceeded: true,
    submitErrors: {},
  };
}

export function failSubmitAction<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
  errors: FormSubmitError | FormErrors | Error | string
): FormState<Fields> {
  const submitErrors = parseSubmitErrors<Fields>(errors);

  const nextState = {
    ...formState,
    isSubmitting: false,
    submitSucceeded: false,
    submitFailed: true,
    submitErrors,
  };

  if ('_global' in submitErrors && submitErrors._global) {
    nextState.submitError = submitErrors._global;
  }

  Object.keys(formState.fields).forEach((name: keyof Fields) => {
    if (name in submitErrors && submitErrors[name]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[name].submitError = submitErrors[name];
    }
  });

  return nextState;
}
