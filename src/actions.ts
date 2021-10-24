import isEqual from 'lodash.isequal';
import {
  Fields,
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

function checkFormFields<F extends FormFields = FormFields>(
  values?: Partial<F>,
  validate?: FormValidationFunction<F>,
): FormErrors<F> | undefined {
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

function dispatchErrors<F extends FormFields = FormFields>(
  state: FormState<F>,
  errors: FormErrors<F>,
): FormState<F> {
  const nextState: FormState<F> = { ...state, errors };

  Object.entries(errors).forEach(([field, error]: [keyof F, string | undefined]) => {
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

function dispatchWarnings<F extends FormFields = FormFields>(
  state: FormState<F>,
  warnings: FormErrors<F>,
): FormState<F> {
  const nextState: FormState<F> = { ...state, warnings };

  Object.entries(warnings).forEach(([field, warning]: [keyof F, string | undefined]) => {
    if (!warning || !nextState.warnings) {
      return;
    }
    if (field === '_global' && warning) {
      nextState.warning = warning;
    } else if (nextState.fields && field in nextState.fields) {
      const nextField: FieldState | undefined = nextState.fields[field];
      if (nextField) {
        nextState.fields = {
          ...nextState.fields,
          [field]: { ...nextField, isValid: false, warning },
        };
      }
    }
  });

  return nextState;
}

function checkFieldChanges<F extends FormFields = FormFields>(state: FormState<F>): FormState<F> {
  return {
    ...state,
    hasChanged: Object.values(state.fields as { [key in keyof F]: FieldState }).reduce(
      (hasChanged: boolean, field: FieldState) => field.hasChanged || hasChanged,
      false,
    ),
  };
}

function validateForm<F extends FormFields = FormFields>(state: FormState<F>): FormState<F> {
  let nextState: FormState<F> = {
    ...state,
    errors: undefined,
    error: undefined,
    warnings: undefined,
    warning: undefined,
    isValid: true,
  };

  if (state.validate) {
    const errors = checkFormFields<F>(state.values, state.validate);

    if (errors) {
      nextState = dispatchErrors<F>(nextState, errors);
    }
  }

  if (state.warn) {
    const warnings = checkFormFields<F>(state.values, state.warn);

    if (warnings) {
      nextState = dispatchWarnings<F>(nextState, warnings);
    }
  }

  if (nextState.errors && Object.keys(nextState.errors).length) {
    nextState.isValid = false;
  }

  return nextState;
}

export function getSafeName<F extends FormFields = FormFields>(name: keyof F): string {
  if (typeof name === 'number') {
    return name.toString(10);
  }
  if (typeof name === 'symbol') {
    return name.toString();
  }
  return name;
}

export function mountFieldAction<F extends FormFields = FormFields, Value = unknown>(
  state: FormState<F>,
  name: keyof F,
  initialValue: Value,
): FormState<F> {
  const nextState: FormState<F> = {
    ...state,
  };

  const safeName = getSafeName<F>(name);

  const field: FieldState<Value> = {
    ...getDefaultFieldState<Value>(),
    name: safeName,
    initialValue,
    value: initialValue,
  };

  if (!nextState.fields) {
    nextState.fields = {};
  }

  Object.defineProperty(nextState.fields, safeName, {
    value: field,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  if (nextState.changes && nextState.changes[safeName]) {
    delete nextState.changes[safeName];
  }

  if (!nextState.values) {
    nextState.values = {};
  }

  Object.defineProperty(nextState.values, safeName, {
    value: initialValue,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  return checkFieldChanges<F>(validateForm<F>(nextState));
}

export function focusFieldAction<F extends FormFields = FormFields>(
  state: FormState<F>,
  name: keyof F,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

  if (!nextState.fields[safeName]) {
    throw new Error('Field not found');
  }

  nextState.isActive = true;
  nextState.visited = true;

  Object.defineProperty(nextState.fields, safeName, {
    value: {
      ...nextState.fields[safeName],
      isActive: true,
      visited: true,
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  return nextState;
}

export function changeFieldAction<Value = unknown, F extends FormFields = FormFields>(
  state: FormState<F>,
  name: keyof F,
  value: Value,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

  const field = nextState.fields[safeName];

  if (!field) {
    throw new Error('Field not found');
  }

  const hasChanged = !isEqual(value, field.initialValue);

  if (hasChanged) {
    if (!nextState.changes) {
      nextState.changes = {};
    }
    Object.defineProperty(nextState.changes, safeName, {
      value,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } else if (nextState.changes && safeName in nextState.changes) {
    delete nextState.changes[safeName];
  }

  Object.defineProperty(nextState.fields, safeName, {
    value: {
      ...field,
      error: undefined,
      warning: undefined,
      isValid: true,
      hasChanged,
      value,
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  if (!nextState.values) {
    nextState.values = {};
  }

  Object.defineProperty(nextState.values, safeName, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  if (nextState.onChange) {
    nextState.onChange(nextState.values as F, nextState.changes as Partial<F>);
  }

  return checkFieldChanges<F>(nextState.liveValidation ? validateForm<F>(nextState) : nextState);
}

export function blurFieldAction<F extends FormFields = FormFields>(
  state: FormState<F>,
  name: keyof F,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

  if (!nextState.fields[safeName]) {
    throw new Error('Field not found');
  }

  nextState.isActive = false;

  Object.defineProperty(nextState.fields, safeName, {
    value: { ...nextState.fields[safeName], isActive: false },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  return nextState.liveValidation ? nextState : validateForm<F>(nextState);
}

export function resetFieldAction<F extends FormFields = FormFields>(
  state: FormState<F>,
  name: keyof F,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

  const field = nextState.fields[safeName];

  if (!field) {
    throw new Error('Field not found');
  }

  if (nextState.changes && safeName in nextState.changes) {
    delete nextState.changes[safeName];
  }

  Object.defineProperty<Fields>(nextState.fields, safeName, {
    value: {
      ...field,
      ...getDefaultFieldState<F>(),
      value: field.initialValue,
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  if (!nextState.values) {
    nextState.values = {};
  }

  Object.defineProperty(nextState.values, safeName, {
    value: field.initialValue,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  if (nextState.onChange) {
    nextState.onChange(nextState.values as F, nextState.changes as Partial<F>);
  }

  return checkFieldChanges<F>(nextState.liveValidation ? validateForm<F>(nextState) : nextState);
}

export function resetFormAction<F extends FormFields = FormFields>(
  state: FormState<F>,
): FormState<F> {
  const nextState: FormState<F> = {
    ...state,
    ...getDefaultFormState<F>(),
  };

  if (nextState.fields) {
    Object.entries(nextState.fields).forEach(([name, field]: [keyof F, FieldState | undefined]) => {
      if (!field) {
        return;
      }

      if (!nextState.fields) {
        throw new Error('No fields mounted !');
      }

      Object.defineProperty<Fields>(nextState.fields, name, {
        value: {
          ...field,
          ...getDefaultFieldState<F>(),
          value: field.initialValue,
        },
        configurable: true,
        enumerable: true,
        writable: true,
      });

      if (!nextState.values) {
        nextState.values = {};
      }
    });
  }

  delete nextState.changes;

  if (nextState.onChange) {
    nextState.onChange(nextState.values as F);
  }

  return nextState.liveValidation ? validateForm<F>(nextState) : nextState;
}

export function startSubmitAction<F extends FormFields = FormFields>(
  state: FormState<F>,
): FormState<F> {
  const nextState = {
    ...state,
    isSubmitting: true,
    submitSucceeded: false,
    submitFailed: false,
    submitCounter: state.submitCounter + 1,
  };

  if (nextState.fields) {
    Object.entries(nextState.fields).forEach(([name, field]: [keyof F, FieldState | undefined]) => {
      Object.defineProperty(nextState.fields, name, {
        value: {
          ...field,
          submitted: true,
        },
        configurable: true,
        enumerable: true,
        writable: true,
      });
    });
  }

  return nextState;
}

function parseSubmitErrors<F extends FormFields = FormFields>(
  errors: FormSubmitError | FormErrors | Error | string,
): FormErrors<F> {
  if (!errors) {
    return {};
  }
  if (typeof errors === 'object' && 'formErrors' in errors && errors.formErrors) {
    return errors.formErrors as FormErrors<F>;
  }
  if (errors instanceof Error && errors) {
    return { _global: errors.message };
  }
  if (typeof errors === 'string') {
    return { _global: errors };
  }
  if (typeof errors === 'object' && errors) {
    return errors as FormErrors<F>;
  }
  return { _global: 'Unknown error' };
}

export function failSubmitAction<F extends FormFields = FormFields>(
  state: FormState<F>,
  submitErrors: FormSubmitError<F> | FormErrors<F> | Error | string,
): FormState<F> {
  const errors = parseSubmitErrors<F>(submitErrors);

  let nextState: FormState<F> = {
    ...state,
    isSubmitting: false,
    submitSucceeded: false,
    submitFailed: true,
  };

  nextState = dispatchErrors<F>(nextState, errors);

  return nextState;
}

export async function submitAction<F extends FormFields = FormFields>(
  state: FormState<F>,
): Promise<FormState<F>> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.onSubmit) {
    return {
      ...nextState,
      isSubmitting: false,
      submitFailed: true,
      errors: { _global: 'No submit Handler' },
      error: 'No submit Handler',
    };
  }

  if (nextState.validate) {
    const errors = checkFormFields<F>(nextState.values, nextState.validate);

    if (errors && Object.values(errors).length) {
      return failSubmitAction<F>(nextState, errors);
    }
  }

  const result = nextState.onSubmit(nextState.values as F, nextState.changes);

  if (result instanceof Promise) {
    await result;
  } else if (result && result instanceof Error) {
    throw result;
  } else if (result) {
    throw new FormSubmitError(result);
  }

  return {
    ...nextState,
    isSubmitting: false,
    submitSucceeded: true,
  };
}
