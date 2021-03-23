import isEqual from 'lodash.isequal';
import {
  defaultFieldState,
  FieldState,
  FormErrors,
  FormFields,
  FormState,
  FormSubmitError,
  FormValidationFunction,
} from './state';

function parseError(error: Error | string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return error;
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

function dispatchErrors<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
  errors: FormErrors<Fields>
): FormState<Fields> {
  const nextState = { ...formState, errors };

  Object.keys(errors).forEach((field: keyof Fields) => {
    nextState.errors[field] = errors[field];

    if (field === '_global' && errors._global) {
      nextState.error = errors._global;
    } else if (field in nextState.fields) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[field].error = errors[field];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[field].isValid = false;
    }
  });

  return nextState;
}

function dispatchWarnings<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>,
  warnings: FormErrors<Fields>
): FormState<Fields> {
  const nextState = { ...formState, warnings };

  Object.keys(warnings).forEach((field: keyof Fields) => {
    nextState.warnings[field] = warnings[field];

    if (field === '_global' && warnings._global) {
      nextState.warning = warnings._global;
    } else if (field in nextState.fields) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextState.fields[field].warning = warnings[field];
    }
  });

  return nextState;
}

function checkFieldChanges<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
): FormState<Fields> {
  return {
    ...formState,
    hasChanged: Object.values(
      formState.fields as { [key in keyof Fields]: FieldState }
    ).reduce(
      (hasChanged: boolean, field: FieldState) =>
        field.hasChanged || hasChanged,
      false
    ),
  };
}

function validateForm<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
): FormState<Fields> {
  let nextState: FormState<Fields> = {
    ...formState,
    errors: {},
    error: null,
    warnings: {},
    warning: null,
    isValid: true,
  };

  if (formState.validate) {
    const errors = checkFormFields<Fields>(
      formState.values,
      formState.validate
    );

    nextState = dispatchErrors<Fields>(nextState, errors);
  }

  if (formState.warn) {
    const warnings = checkFormFields<Fields>(formState.values, formState.warn);

    nextState = dispatchWarnings<Fields>(nextState, warnings);
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
  initialValue: Value
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
      },
    },
    values: {
      ...values,
      [name]: initialValue,
    },
    changes: nextChanges,
  };

  return checkFieldChanges<Fields>(validateForm<Fields>(nextState));
}

export function focusFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: keyof Fields
): FormState<Fields> {
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
    values: {
      ...values,
      [name]: value,
    },
    changes: nextChanges,
  };

  if (formState.onChange) {
    formState.onChange(
      nextState.values as Fields,
      nextState.changes as Partial<Fields>
    );
  }

  return checkFieldChanges<Fields>(
    formState.liveValidation ? validateForm<Fields>(nextState) : nextState
  );
}

export function blurFieldAction<Fields extends FormFields = FormFields>(
  { fields, ...formState }: FormState<Fields>,
  name: keyof Fields
): FormState<Fields> {
  if (!(name in fields) || !fields[name]) {
    throw new Error('Field not found');
  }
  const nextState = {
    ...formState,
    isActive: false,
    fields: {
      ...fields,
      [name]: { ...fields[name], isActive: false },
    },
  };

  return formState.liveValidation ? nextState : validateForm<Fields>(nextState);
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
        submitted: false,
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

  if (formState.onChange) {
    formState.onChange(
      nextState.values as Fields,
      nextState.changes as Partial<Fields>
    );
  }

  return checkFieldChanges<Fields>(
    formState.liveValidation ? validateForm<Fields>(nextState) : nextState
  );
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
    errors: {},
    error: null,
    warnings: {},
    warning: null,
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
      submitted: false,
      value: field.initialValue,
      error: null,
      warning: null,
      submitError: null,
    };

    nextState.values[name] = field.initialValue;
  });

  if (formState.onChange) {
    formState.onChange(
      nextState.values as Fields,
      nextState.changes as Partial<Fields>
    );
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

  Object.keys(nextState.fields).forEach((name: keyof Fields) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    nextState.fields[name].submitted = true;
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
    'formErrors' in errors &&
    errors.formErrors
  ) {
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
  submitErrors: FormSubmitError<Fields> | FormErrors<Fields> | Error | string
): FormState<Fields> {
  const errors = parseSubmitErrors<Fields>(submitErrors);

  let nextState = {
    ...formState,
    isSubmitting: false,
    submitSucceeded: false,
    submitFailed: true,
  };

  nextState = dispatchErrors<Fields>(nextState, errors);

  return nextState;
}

export async function submitAction<Fields extends FormFields = FormFields>(
  formState: FormState<Fields>
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
    const errors = checkFormFields<Fields>(
      formState.values,
      formState.validate
    );

    if (Object.values(errors).length) {
      return failSubmitAction<Fields>(formState, errors);
    }
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
  };
}
