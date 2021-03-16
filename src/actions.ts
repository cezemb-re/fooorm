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

function checkFormFields<Fields extends FormFields = FormFields>(
  values: Partial<Fields>,
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
function checkForm<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
): FormState<Fields> {
  const nextState: FormState<Fields> = {
    ...formState,
    errors: {},
    error: null,
    warnings: {},
    warning: null,
    isValid: true,
    hasChanged: false,
  };

  Object.keys(formState.fields).forEach((name: keyof Fields) => {
    const field = formState.fields[name];

    const error = field?.error;
    if (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.errors[name] = error;
    } else {
      delete nextState.errors[name];
    }

    const warning = field?.warning;
    if (warning) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.warnings[name] = warning;
    } else {
      delete nextState.warnings[name];
    }

    if (field?.hasChanged) {
      nextState.hasChanged = true;
    }
  });

  if (formState.validate) {
    const errors = checkFormFields<Fields>(
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
    const warnings = checkFormFields<Fields>(formState.values, formState.warn);

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
  Fields extends FormFields = FormFields,
  Value = any
>(
  { nbFields, fields, values, changes, ...formState }: FormState<Fields>,
  name: keyof Fields,
  initialValue: Value,
  validate: FieldValidationFunction | undefined,
  warn: FieldValidationFunction | undefined
): FormState<Fields> {
  let value: Value;
  let hasChanged = false;

  const field = fields[name];

  if (field !== undefined && isEqual(field.initialValue, initialValue)) {
    value = field.value;
    hasChanged = field.hasChanged;
  } else {
    value = initialValue;
  }

  const nextChanges = { ...changes };
  if (hasChanged) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    nextChanges[name] = value;
  } else if (name in nextChanges) {
    delete nextChanges[name];
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
        hasChanged,
        validate,
        warn,
      },
    },
    values: {
      ...values,
      [name]: initialValue,
    },
    changes: nextChanges,
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

  return checkForm(nextState);
}

export function focusFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: keyof Fields
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
  { fields, values, changes, ...formState }: FormState<Fields>,
  name: keyof Fields,
  value: Value
): FormState<Fields> {
  const field = fields[name];

  if (!field) {
    throw new Error('Field not found');
  }

  const hasChanged = !isEqual(value, field.initialValue);

  const nextChanges = { ...changes };
  if (hasChanged) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    nextChanges[name] = value;
  } else if (name in nextChanges) {
    delete nextChanges[name];
  }

  const nextState = {
    ...formState,
    fields: {
      ...fields,
      [name]: {
        ...fields[name],
        hasChanged,
        value,
      },
    },
    values: {
      ...values,
      [name]: value,
    },
    changes: nextChanges,
  };

  if ('validate' in field && field.validate) {
    nextState.fields[name].error = validateField(value, field.validate);
    if (nextState.fields[name].error) {
      nextState.fields[name].isValid = false;
    }
  }

  if ('warn' in field && field.warn) {
    nextState.fields[name].warning = validateField(value, field.warn);
  }

  return checkForm(nextState);
}

export function blurFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: keyof Fields
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
  { fields, values, changes, ...formState }: FormState<Fields>,
  name: keyof Fields
): FormState<Fields> {
  const field = fields[name];

  if (!field) {
    throw new Error('Field not found');
  }

  const nextChanges = { ...changes };

  if (name in changes) {
    delete nextChanges[name];
  }

  const nextState: FormState<Fields> = {
    ...formState,
    fields: {
      ...fields,
      [name]: {
        ...fields[name],
        hasChanged: false,
        isValid: true,
        value: field.initialValue,
        error: null,
        warning: null,
        submitError: null,
      },
    },
    values: {
      ...values,
      [name]: field.initialValue,
    },
    changes: nextChanges,
  };

  if (field.validate) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    nextState.fields[name].error = validateField(
      field.initialValue,
      field.validate
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (nextState.fields[name].error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[name].isValid = false;
    }
  }

  if (field.warn) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    nextState.fields[name].warning = validateField(
      field.initialValue,
      field.warn
    );
  }

  return checkForm<Fields>(nextState);
}

export function resetFormAction<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
): FormState<Fields> {
  const nextState: FormState<Fields> = {
    ...formState,
    submitCounter: 0,
    hasChanged: false,
    isSubmitting: false,
    isValid: true,
    submitSucceeded: false,
    submitFailed: false,
    warnings: {},
    errors: {},
    submitErrors: {},
    changes: {},
  };

  Object.keys(formState.fields).forEach((name: keyof Fields) => {
    const field = formState.fields[name];

    if (!field) {
      throw new Error('Field not found');
    }

    nextState.fields[name] = {
      ...formState.fields[name],
      hasChanged: false,
      isValid: true,
      initialValue: field.initialValue,
      value: field.initialValue,
      error: null,
      warning: null,
      submitError: null,
    };

    if (field.validate) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[name].error = validateField(
        field.initialValue,
        field.validate
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (nextState.fields[name].error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        nextState.fields[name].isValid = false;
      }
    }

    if (formState.warn) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[name].warning = validateField(
        field.initialValue,
        field.warn
      );
    }

    nextState.values[name] = field.initialValue;
  });

  return checkForm<Fields>(nextState);
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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

  const result = formState.onSubmit(
    formState.values as Fields,
    formState.changes as Partial<Fields>
  );

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
