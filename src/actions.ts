import isEqual from 'lodash.isequal';
import {
  FieldModifier,
  FieldModifierFunction,
  Fields,
  FieldState,
  FormErrors,
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

function checkFormFields<F extends object = Record<string, unknown>>(
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

function dispatchErrors<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  errors: FormErrors<F>,
): FormState<F> {
  const nextState: FormState<F> = { ...state, errors };

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

function dispatchWarnings<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  warnings: FormErrors<F>,
): FormState<F> {
  const nextState: FormState<F> = { ...state, warnings };

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

function checkFieldChanges<F extends object = Record<string, unknown>>(
  state: FormState<F>,
): FormState<F> {
  return {
    ...state,
    hasChanged: Object.values<FieldState>(state.fields as { [key in keyof F]: FieldState }).reduce(
      (hasChanged: boolean, field: FieldState) => field.hasChanged || hasChanged,
      false,
    ),
  };
}

function validateForm<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  validate?: FormValidationFunction<F>,
  warn?: FormValidationFunction<F>,
): FormState<F> {
  let nextState: FormState<F> = {
    ...state,
    errors: undefined,
    error: undefined,
    warnings: undefined,
    warning: undefined,
    isValid: true,
  };

  if (validate) {
    const errors = checkFormFields<F>(state.values, validate);

    if (errors) {
      nextState = dispatchErrors<F>(nextState, errors);
    }
  }

  if (warn) {
    const warnings = checkFormFields<F>(state.values, warn);

    if (warnings) {
      nextState = dispatchWarnings<F>(nextState, warnings);
    }
  }

  if (nextState.errors && Object.keys(nextState.errors).length) {
    nextState.isValid = false;
  }

  return nextState;
}

export function getSafeName<F extends object = Record<string, unknown>>(name: keyof F): string {
  if (typeof name === 'number') {
    return name.toString(10);
  }
  if (typeof name === 'symbol') {
    return name.toString();
  }
  return name;
}

export function mountFieldAction<F extends object = Record<string, unknown>, V = unknown>(
  state: FormState<F>,
  name: keyof F,
  initialValue: V,
  validate?: FormValidationFunction<F>,
  warn?: FormValidationFunction<F>,
): FormState<F> {
  const nextState: FormState<F> = {
    ...state,
  };

  const safeName = getSafeName<F>(name);

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

  return checkFieldChanges<F>(validateForm<F>(nextState, validate, warn));
}

export function focusFieldAction<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  name: keyof F,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

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

export function changeFieldAction<V = unknown, F extends object = Record<string, unknown>>(
  state: FormState<F>,
  name: keyof F,
  modifier: FieldModifier<V>,
  onChange?: FormSubmitFunction<F>,
  liveValidation?: boolean,
  validate?: FormValidationFunction<F>,
  warn?: FormValidationFunction<F>,
  onChangeField?: (value?: V) => void,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

  const field = (nextState.fields as { [key: string]: FieldState<V> | undefined })[safeName];

  if (!field) {
    throw new Error('Field not found');
  }

  let value: V | undefined;
  if (
    typeof modifier === 'object' &&
    modifier &&
    'target' in modifier &&
    modifier.target &&
    'value' in modifier.target
  ) {
    value = modifier.target.value;
  } else if (
    typeof modifier === 'object' &&
    modifier &&
    'currentTarget' in modifier &&
    modifier.currentTarget &&
    'value' in modifier.currentTarget
  ) {
    value = modifier.currentTarget.value;
  } else if (typeof modifier === 'function') {
    value = (modifier as FieldModifierFunction<V>)(field.value);
  } else {
    value = modifier as V;
  }

  if (onChangeField) {
    onChangeField(value);
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
    onChange(nextState.values as F, nextState.changes as Partial<F>);
  }

  return checkFieldChanges<F>(
    liveValidation ? validateForm<F>(nextState, validate, warn) : nextState,
  );
}

export function blurFieldAction<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  name: keyof F,
  liveValidation?: boolean,
  validate?: FormValidationFunction<F>,
  warn?: FormValidationFunction<F>,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

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

  return liveValidation ? nextState : validateForm<F>(nextState, validate, warn);
}

export function resetFieldAction<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  name: keyof F,
  onChange?: FormSubmitFunction<F>,
  liveValidation?: boolean,
  validate?: FormValidationFunction<F>,
  warn?: FormValidationFunction<F>,
): FormState<F> {
  const nextState: FormState<F> = { ...state };

  if (!nextState.fields) {
    throw new Error('No fields !');
  }

  const safeName = getSafeName<F>(name);

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

  if (onChange) {
    onChange(nextState.values as F, nextState.changes as Partial<F>);
  }

  return checkFieldChanges<F>(
    liveValidation ? validateForm<F>(nextState, validate, warn) : nextState,
  );
}

export function resetFormAction<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  onChange?: FormSubmitFunction<F>,
  validate?: FormValidationFunction<F>,
  warn?: FormValidationFunction<F>,
  liveValidation?: boolean,
): FormState<F> {
  const nextState: FormState<F> = {
    ...state,
    ...getDefaultFormState<F>(),
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
      },
    );
  }

  delete nextState.changes;

  if (onChange) {
    onChange(nextState.values as F);
  }

  return liveValidation ? validateForm<F>(nextState, validate, warn) : nextState;
}

export function startSubmitAction<F extends object = Record<string, unknown>>(
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

function parseSubmitErrors<F extends object = Record<string, unknown>>(
  errors: FormSubmitError | FormErrors | Error | string,
): FormErrors<F> {
  if (!errors) {
    return {};
  }
  if (typeof errors === 'object' && 'submitErrors' in errors && errors.submitErrors) {
    return errors.submitErrors as FormErrors<F>;
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

export function failSubmitAction<F extends object = Record<string, unknown>>(
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

export async function submitAction<F extends object = Record<string, unknown>>(
  state: FormState<F>,
  onSubmit?: FormSubmitFunction<F>,
  validate?: FormValidationFunction<F>,
): Promise<FormState<F>> {
  const nextState: FormState<F> = { ...state };

  if (validate) {
    const errors = checkFormFields<F>(nextState.values, validate);

    if (errors && Object.values(errors).length) {
      return failSubmitAction<F>(nextState, errors);
    }
  }

  if (onSubmit) {
    const result = onSubmit(nextState.values as F, nextState.changes);

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
