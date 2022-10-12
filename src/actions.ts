import isEqual from 'lodash.isequal';
import {
  Fields,
  FieldState,
  FormErrors,
  FormFields,
  FormState,
  FormSubmitError,
  FormSubmitFunction,
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

function checkFormFields<FF = FormFields>(
  values?: Partial<FF>,
  validate?: FormValidationFunction<FF>,
): FormErrors<FF> | undefined {
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

function dispatchErrors<FF = FormFields>(
  state: FormState<FF>,
  errors: FormErrors<FF>,
): FormState<FF> {
  const nextState: FormState<FF> = { ...state, errors };

  Object.entries(errors).forEach(([field, error]: [string, string | undefined]) => {
    if (!error || !nextState.errors) {
      return;
    }
    if (field === '_global' && error) {
      nextState.error = error;
    } else if (nextState.fields && field in nextState.fields) {
      const nextField: FieldState | undefined = (
        nextState.fields as { [key: string]: FieldState | undefined }
      )[field];
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

function dispatchWarnings<FF = FormFields>(
  state: FormState<FF>,
  warnings: FormErrors<FF>,
): FormState<FF> {
  const nextState: FormState<FF> = { ...state, warnings };

  Object.entries(warnings).forEach(([field, warning]: [string, string | undefined]) => {
    if (!warning || !nextState.warnings) {
      return;
    }
    if (field === '_global' && warning) {
      nextState.warning = warning;
    } else if (nextState.fields && field in nextState.fields) {
      const nextField: FieldState | undefined = (
        nextState.fields as { [key: string]: FieldState | undefined }
      )[field];
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

function checkFieldChanges<FF = FormFields>(state: FormState<FF>): FormState<FF> {
  return {
    ...state,
    hasChanged: Object.values<FieldState>(state.fields as { [key in keyof FF]: FieldState }).reduce(
      (hasChanged: boolean, field: FieldState) => field.hasChanged || hasChanged,
      false,
    ),
  };
}

function validateForm<FF = FormFields>(
  state: FormState<FF>,
  validate?: FormValidationFunction<FF>,
  warn?: FormValidationFunction<FF>,
): FormState<FF> {
  let nextState: FormState<FF> = {
    ...state,
    errors: undefined,
    error: undefined,
    warnings: undefined,
    warning: undefined,
    isValid: true,
  };

  if (validate) {
    const errors = checkFormFields<FF>(state.values, validate);

    if (errors) {
      nextState = dispatchErrors<FF>(nextState, errors);
    }
  }

  if (warn) {
    const warnings = checkFormFields<FF>(state.values, warn);

    if (warnings) {
      nextState = dispatchWarnings<FF>(nextState, warnings);
    }
  }

  if (nextState.errors && Object.keys(nextState.errors).length) {
    nextState.isValid = false;
  }

  return nextState;
}

export function getSafeName<FF = FormFields>(name: keyof FF): string {
  if (typeof name === 'number') {
    return name.toString(10);
  }
  if (typeof name === 'symbol') {
    return name.toString();
  }
  return name;
}

export function mountFieldAction<FF = FormFields, V = unknown>(
  state: FormState<FF>,
  name: keyof FF,
  initialValue: V,
  validate?: FormValidationFunction<FF>,
  warn?: FormValidationFunction<FF>,
): FormState<FF> {
  const nextState: FormState<FF> = {
    ...state,
  };

  const safeName = getSafeName<FF>(name);

  const field: FieldState<V> = {
    ...getDefaultFieldState<V>(),
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

  if (nextState.changes && (nextState.changes as { [key: string]: V })[safeName]) {
    delete (nextState.changes as { [key: string]: V })[safeName];
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

  return checkFieldChanges<FF>(validateForm<FF>(nextState, validate, warn));
}

export function focusFieldAction<FF = FormFields>(
  state: FormState<FF>,
  name: keyof FF,
): FormState<FF> {
  const nextState: FormState<FF> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<FF>(name);

  if (!(nextState.fields as { [key: string]: FieldState | undefined })[safeName]) {
    throw new Error('Field not found');
  }

  nextState.isActive = true;
  nextState.visited = true;

  Object.defineProperty(nextState.fields, safeName, {
    value: {
      ...(nextState.fields as { [key: string]: FieldState | undefined })[safeName],
      isActive: true,
      visited: true,
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  return nextState;
}

export function changeFieldAction<V = unknown, FF = FormFields>(
  state: FormState<FF>,
  name: keyof FF,
  value: V,
  onChange?: FormSubmitFunction<FF>,
  liveValidation?: boolean,
  validate?: FormValidationFunction<FF>,
  warn?: FormValidationFunction<FF>,
): FormState<FF> {
  const nextState: FormState<FF> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<FF>(name);

  const field = (nextState.fields as { [key: string]: FieldState<V> | undefined })[safeName];

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
    delete (nextState.changes as { [key: string]: FieldState<V> | undefined })[safeName];
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

  if (onChange) {
    onChange(nextState.values as FF, nextState.changes as Partial<FF>);
  }

  return checkFieldChanges<FF>(
    liveValidation ? validateForm<FF>(nextState, validate, warn) : nextState,
  );
}

export function blurFieldAction<FF = FormFields>(
  state: FormState<FF>,
  name: keyof FF,
  liveValidation?: boolean,
  validate?: FormValidationFunction<FF>,
  warn?: FormValidationFunction<FF>,
): FormState<FF> {
  const nextState: FormState<FF> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<FF>(name);

  if (!(nextState.fields as { [key: string]: FieldState | undefined })[safeName]) {
    throw new Error('Field not found');
  }

  nextState.isActive = false;

  Object.defineProperty(nextState.fields, safeName, {
    value: {
      ...(nextState.fields as { [key: string]: FieldState | undefined })[safeName],
      isActive: false,
    },
    configurable: true,
    enumerable: true,
    writable: true,
  });

  return liveValidation ? nextState : validateForm<FF>(nextState, validate, warn);
}

export function resetFieldAction<FF = FormFields>(
  state: FormState<FF>,
  name: keyof FF,
  onChange?: FormSubmitFunction<FF>,
  liveValidation?: boolean,
  validate?: FormValidationFunction<FF>,
  warn?: FormValidationFunction<FF>,
): FormState<FF> {
  const nextState: FormState<FF> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<FF>(name);

  const field = (nextState.fields as { [key: string]: FieldState | undefined })[safeName];

  if (!field) {
    throw new Error('Field not found');
  }

  if (nextState.changes && safeName in nextState.changes) {
    delete (nextState.changes as { [key: string]: FieldState | undefined })[safeName];
  }

  Object.defineProperty<Fields>(nextState.fields, safeName, {
    value: {
      ...field,
      ...getDefaultFieldState<FF>(),
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

  if (onChange) {
    onChange(nextState.values as FF, nextState.changes as Partial<FF>);
  }

  return checkFieldChanges<FF>(
    liveValidation ? validateForm<FF>(nextState, validate, warn) : nextState,
  );
}

export function resetFormAction<FF = FormFields>(
  state: FormState<FF>,
  onChange?: FormSubmitFunction<FF>,
  validate?: FormValidationFunction<FF>,
  warn?: FormValidationFunction<FF>,
  liveValidation?: boolean,
): FormState<FF> {
  const nextState: FormState<FF> = {
    ...state,
    ...getDefaultFormState<FF>(),
  };

  if (nextState.fields) {
    Object.entries<FieldState | undefined>(nextState.fields).forEach(
      ([name, field]: [string, FieldState | undefined]) => {
        if (!field) {
          return;
        }

        if (!nextState.fields) {
          throw new Error('No fields mounted !');
        }

        Object.defineProperty<Fields>(nextState.fields, name, {
          value: {
            ...field,
            ...getDefaultFieldState<FF>(),
            value: field.initialValue,
          },
          configurable: true,
          enumerable: true,
          writable: true,
        });

        if (!nextState.values) {
          nextState.values = {};
        }
      },
    );
  }

  delete nextState.changes;

  if (onChange) {
    onChange(nextState.values as FF);
  }

  return liveValidation ? validateForm<FF>(nextState, validate, warn) : nextState;
}

export function startSubmitAction<FF = FormFields>(state: FormState<FF>): FormState<FF> {
  const nextState = {
    ...state,
    isSubmitting: true,
    submitSucceeded: false,
    submitFailed: false,
    submitCounter: state.submitCounter + 1,
  };

  if (nextState.fields) {
    Object.entries<FieldState | undefined>(nextState.fields).forEach(
      ([name, field]: [string, FieldState | undefined]) => {
        Object.defineProperty(nextState.fields, name, {
          value: {
            ...field,
            submitted: true,
          },
          configurable: true,
          enumerable: true,
          writable: true,
        });
      },
    );
  }

  return nextState;
}

function parseSubmitErrors<FF = FormFields>(
  errors: FormSubmitError | FormErrors | Error | string,
): FormErrors<FF> {
  if (!errors) {
    return {};
  }
  if (typeof errors === 'object' && 'submitErrors' in errors && errors.submitErrors) {
    return errors.submitErrors as FormErrors<FF>;
  }
  if (errors instanceof Error && errors) {
    return { _global: errors.message };
  }
  if (typeof errors === 'string') {
    return { _global: errors };
  }
  if (typeof errors === 'object' && errors) {
    return errors as FormErrors<FF>;
  }
  return { _global: 'Unknown error' };
}

export function failSubmitAction<FF = FormFields>(
  state: FormState<FF>,
  submitErrors: FormSubmitError<FF> | FormErrors<FF> | Error | string,
): FormState<FF> {
  const errors = parseSubmitErrors<FF>(submitErrors);

  let nextState: FormState<FF> = {
    ...state,
    isSubmitting: false,
    submitSucceeded: false,
    submitFailed: true,
  };

  nextState = dispatchErrors<FF>(nextState, errors);

  return nextState;
}

export async function submitAction<FF = FormFields>(
  state: FormState<FF>,
  onSubmit?: FormSubmitFunction<FF>,
  validate?: FormValidationFunction<FF>,
): Promise<FormState<FF>> {
  const nextState: FormState<FF> = { ...state };

  if (validate) {
    const errors = checkFormFields<FF>(nextState.values, validate);

    if (errors && Object.values(errors).length) {
      return failSubmitAction<FF>(nextState, errors);
    }
  }

  if (onSubmit) {
    const result = onSubmit(nextState.values as FF, nextState.changes);

    if (result instanceof Promise) {
      await result;
    } else if (result && result instanceof Error) {
      throw result;
    } else if (result) {
      throw new FormSubmitError(result);
    }
  }

  return {
    ...nextState,
    isSubmitting: false,
    submitSucceeded: true,
  };
}
