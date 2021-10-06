import isEqual from 'lodash.isequal';
import {
  FieldState,
  FormErrors,
  FormFields,
  FormState,
  FormSubmitError,
  FormValidationFunction,
  getDefaultFieldState,
  getDefaultFormState,
} from './state';

function parseError(error: Error | string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return error;
}

function checkFormFields<Fields extends FormFields = FormFields>(
  values?: Partial<Fields>,
  validate?: FormValidationFunction<Fields>,
): FormErrors<Fields> | undefined {
  if (!values || !validate) {
    return undefined;
  }

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
    return { _global: parseError(error as Error) };
  }
}

function dispatchErrors<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
  errors: FormErrors<Fields>,
): FormState<Fields> {
  const nextState: FormState<Fields> = { ...formState, errors };

  Object.entries(errors).forEach(([field, error]: [keyof Fields, string | undefined]) => {
    if (!error || !nextState.errors) {
      return;
    }
    if (field === '_global' && error) {
      nextState.error = error;
    } else if (nextState.fields && field in nextState.fields) {
      const nextField: FieldState | undefined = nextState.fields[field];
      if (nextField) {
        nextState.fields = {
          ...nextState.fields,
          [field]: { ...nextField, isValid: false, error },
        };
      }
    }
  });

  return nextState;
}

function dispatchWarnings<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
  warnings: FormErrors<Fields>,
): FormState<Fields> {
  const nextState = { ...formState, warnings };

  Object.keys(warnings).forEach((field: keyof Fields) => {
    nextState.warnings[field] = warnings[field];

    if (field === '_global' && warnings._global) {
      nextState.warning = warnings._global;
    } else if (nextState.fields && field in nextState.fields) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[field].warning = warnings[field];
    }
  });

  return nextState;
}

function checkFieldChanges<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
): FormState<Fields> {
  return {
    ...formState,
    hasChanged: Object.values(formState.fields as { [key in keyof Fields]: FieldState }).reduce(
      (hasChanged: boolean, field: FieldState) => field.hasChanged || hasChanged,
      false,
    ),
  };
}

function validateForm<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
): FormState<Fields> {
  let nextState: FormState<Fields> = {
    ...formState,
    errors: undefined,
    error: undefined,
    warnings: undefined,
    warning: undefined,
    isValid: true,
  };

  if (formState.validate) {
    const errors = checkFormFields<Fields>(formState.values, formState.validate);

    if (errors) {
      nextState = dispatchErrors<Fields>(nextState, errors);
    }
  }

  if (formState.warn) {
    const warnings = checkFormFields<Fields>(formState.values, formState.warn);

    if (warnings) {
      nextState = dispatchWarnings<Fields>(nextState, warnings);
    }
  }

  if (nextState.errors && Object.keys(nextState.errors).length) {
    nextState.isValid = false;
  }

  return nextState;
}

export function mountFieldAction<Fields extends FormFields = FormFields, Value = any>(
  { nbFields, fields, values, changes, ...formState }: FormState<Fields>,
  name: keyof Fields,
  initialValue: Value,
): FormState<Fields> {
  let value: Value;
  let hasChanged = false;

  if (
    fields &&
    name in fields &&
    fields[name] !== undefined &&
    isEqual(fields[name]?.initialValue, initialValue)
  ) {
    value = fields[name]?.value;
    hasChanged = fields[name]?.hasChanged || false;
  } else {
    value = initialValue;
  }

  let nextChanges: Partial<Fields> | undefined = changes ? { ...changes } : undefined;
  if (hasChanged) {
    if (!nextChanges) {
      nextChanges = {};
    }
    Object.defineProperty(nextChanges, name, { value });
  } else if (nextChanges && name in nextChanges) {
    delete nextChanges[name];
  }

  let safeName: string | undefined;

  if (typeof name === 'number') {
    safeName = name.toString(10);
  } else if (typeof name === 'symbol') {
    safeName = name.toString();
  } else {
    safeName = name;
  }

  const field: FieldState<Value> = {
    ...getDefaultFieldState<Value>(),
    name: safeName,
    initialValue,
    value,
    hasChanged,
  };

  const nextState: FormState<Fields> = {
    ...formState,
    nbFields: fields && name in fields ? nbFields : (nbFields || 0) + 1,
    fields: {},
    values: {},
    changes: nextChanges,
  };

  if (fields) {
    nextState.fields = {
      ...fields,
      [name]: field,
    };
  } else {
    Object.defineProperty(nextState.fields, name, { value: field });
  }

  if (values) {
    nextState.values = {
      ...values,
      [name]: initialValue,
    };
  } else {
    Object.defineProperty(nextState.values, name, { value: initialValue });
  }

  return checkFieldChanges<Fields>(validateForm<Fields>(nextState));
}

export function focusFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: keyof Fields,
): FormState<Fields> {
  if (!fields) {
    throw new Error('No fields !');
  }
  const field = fields[name];

  if (!field) {
    throw new Error('Field not found');
  }

  return {
    ...formState,
    isActive: true,
    visited: true,
    fields: {
      ...fields,
      [name]: { ...field, isActive: true, visited: true },
    },
  };
}

export function changeFieldAction<Value = any, Fields extends FormFields = FormFields>(
  { fields, values, changes, ...formState }: FormState<Fields>,
  name: keyof Fields,
  value: Value,
): FormState<Fields> {
  if (!fields) {
    throw new Error('No fields !');
  }

  const field = fields[name];

  if (!field) {
    throw new Error('Field not found');
  }

  const hasChanged = !isEqual(value, field.initialValue);

  let nextChanges: Partial<Fields> | undefined = changes ? { ...changes } : undefined;
  if (hasChanged) {
    if (!nextChanges) {
      nextChanges = {};
    }
    Object.defineProperty(nextChanges, name, { value });
  } else if (nextChanges && name in nextChanges) {
    delete nextChanges[name];
  }

  const nextState: FormState<Fields> = {
    ...formState,
    fields: {
      ...fields,
      [name]: {
        ...fields[name],
        error: null,
        warning: null,
        isValid: true,
        hasChanged,
        value,
      },
    },
    changes: nextChanges,
  };

  if (values) {
    nextState.values = {
      ...values,
      [name]: value,
    };
  } else {
    nextState.values = {};
    Object.defineProperty(nextState.values, name, { value });
  }

  if (formState.onChange) {
    formState.onChange(nextState.values as Fields, nextState.changes as Partial<Fields>);
  }

  return checkFieldChanges<Fields>(
    formState.liveValidation ? validateForm<Fields>(nextState) : nextState,
  );
}

export function blurFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: keyof Fields,
): FormState<Fields> {
  if (!fields) {
    throw new Error('No fields !');
  }

  const field = fields[name];

  if (!field) {
    throw new Error('Field not found');
  }
  const nextState = {
    ...formState,
    isActive: false,
    fields: {
      ...fields,
      [name]: { ...field, isActive: false },
    },
  };

  return formState.liveValidation ? nextState : validateForm<Fields>(nextState);
}

export function resetFieldAction<Fields extends FormFields = FormFields>(
  { fields, values, changes, ...formState }: FormState<Fields>,
  name: keyof Fields,
): FormState<Fields> {
  if (!fields) {
    throw new Error('No fields !');
  }

  const field = fields[name];

  if (!field) {
    throw new Error('Field not found');
  }

  const nextChanges: Partial<Fields> | undefined = changes ? { ...changes } : undefined;

  if (nextChanges && name in nextChanges) {
    delete nextChanges[name];
  }

  const nextState: FormState<Fields> = {
    ...formState,
    fields: {
      ...fields,
      [name]: {
        ...fields[name],
        hasChanged: false,
        submitted: false,
        isValid: true,
        value: field.initialValue,
        error: null,
        warning: null,
        submitError: null,
      },
    },
    changes: nextChanges,
  };

  if (values) {
    nextState.values = {
      ...values,
      [name]: field.initialValue,
    };
  } else {
    nextState.values = {};
    Object.defineProperty(nextState.values, name, { value: field.initialValue });
  }

  if (formState.onChange) {
    formState.onChange(nextState.values as Fields, nextState.changes as Partial<Fields>);
  }

  return checkFieldChanges<Fields>(
    formState.liveValidation ? validateForm<Fields>(nextState) : nextState,
  );
}

export function resetFormAction<Fields extends FormFields = FormFields>({
  submitCounter,
  hasChanged,
  isSubmitting,
  isValid,
  submitSucceeded,
  submitFailed,
  errors,
  error,
  warnings,
  warning,
  changes,
  ...formState
}: FormState<Fields>): FormState<Fields> {
  const nextState: FormState<Fields> = {
    ...getDefaultFormState<Fields>(),
    ...formState,
  };

  if (formState.fields) {
    Object.entries(formState.fields).forEach(
      ([name, field]: [keyof Fields, FieldState | undefined]) => {
        if (!field) {
          return;
        }

        if (!nextState.fields) {
          throw new Error('No fields mounted !');
        }

        nextState.fields[name] = {
          ...field,
          hasChanged: false,
          isValid: true,
          submitted: false,
          value: field.initialValue,
          error: undefined,
          warning: undefined,
        };

        if (nextState.values) {
          nextState.values[name] = field.initialValue;
        } else {
          nextState.values = {};
          Object.defineProperty(nextState.values, name, { value: field.initialValue });
        }
      },
    );
  }

  if (formState.onChange) {
    formState.onChange(nextState.values as Fields, nextState.changes as Partial<Fields>);
  }

  return formState.liveValidation ? validateForm<Fields>(nextState) : nextState;
}

export function startSubmitAction<Fields extends FormFields = FormFields>({
  submitCounter,
  ...formState
}: FormState<Fields>): FormState<Fields> {
  const nextState = {
    ...formState,
    isSubmitting: true,
    submitSucceeded: false,
    submitFailed: false,
    submitCounter: submitCounter + 1,
  };

  if (nextState.fields) {
    Object.keys(nextState.fields).forEach((name: keyof Fields) => {
      Object.defineProperty(nextState.fields, name, { value: true });
    });
  }

  return nextState;
}

function parseSubmitErrors<Fields extends FormFields = FormFields>(
  errors: FormSubmitError | FormErrors | Error | string,
): FormErrors<Fields> {
  if (!errors) {
    return {};
  }
  if (typeof errors === 'object' && 'formErrors' in errors && errors.formErrors) {
    return errors.formErrors as FormErrors<Fields>;
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

export function failSubmitAction<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
  submitErrors: FormSubmitError<Fields> | FormErrors<Fields> | Error | string,
): FormState<Fields> {
  const errors = parseSubmitErrors<Fields>(submitErrors);

  let nextState: FormState<Fields> = {
    ...formState,
    isSubmitting: false,
    submitSucceeded: false,
    submitFailed: true,
  };

  nextState = dispatchErrors<Fields>(nextState, errors);

  return nextState;
}

export async function submitAction<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
): Promise<FormState<Fields>> {
  if (!formState.onSubmit) {
    return {
      ...formState,
      isSubmitting: false,
      submitFailed: true,
      errors: { _global: 'No submit Handler' },
      error: 'No submit Handler',
    };
  }

  if (formState.validate) {
    const errors = checkFormFields<Fields>(formState.values, formState.validate);

    if (errors && Object.values(errors).length) {
      return failSubmitAction<Fields>(formState, errors);
    }
  }

  const result = formState.onSubmit(
    formState.values as Fields,
    formState.changes as Partial<Fields>,
  );

  if (result instanceof Promise) {
    await result;
  } else if (result && result instanceof Error) {
    throw result;
  } else if (result) {
    throw new FormSubmitError(result);
  }

  return {
    ...formState,
    isSubmitting: false,
    submitSucceeded: true,
  };
}
