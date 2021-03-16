import React, { useCallback, useEffect } from 'react';
import {
  FieldState,
  FormState,
  FieldValidationFunction,
  useFormContext,
  FormFields,
} from './state';

export interface FieldComponentProps<
  Fields extends FormFields = FormFields,
  Value = any
> extends FieldState<Value> {
  form: FormState<Fields>;
  onFocus: () => void;
  onChange: (eventOrValue: any) => void;
  onBlur: () => void;
}

export interface FieldProps<
  Fields extends FormFields = FormFields,
  Value = any
> {
  name: keyof Fields;
  initialValue?: Value;
  component?: string | React.ComponentType<FieldComponentProps<Fields, Value>>;
  validate?: FieldValidationFunction;
  warn?: FieldValidationFunction;
  children?: React.ReactNode[];
  [key: string]: any;
}

function Field<Fields extends FormFields = FormFields, Value = any>({
  name,
  initialValue,
  validate,
  warn,
  component,
  children,
  ...customProps
}: FieldProps<Fields, Value>): React.ReactElement | null {
  const {
    formState,
    mountField,
    focusField,
    changeField,
    blurField,
  } = useFormContext<Fields>();

  useEffect(() => {
    mountField(name, initialValue, validate, warn);
  }, [name, initialValue, validate, warn, mountField]);

  const onFocus = useCallback(() => {
    focusField(name);
  }, [focusField, name]);

  const onChange = useCallback(
    (eventOrValue: any) => {
      if (typeof eventOrValue === 'object' && eventOrValue) {
        if ('target' in eventOrValue && 'value' in eventOrValue.target) {
          changeField(name, eventOrValue.target.value);
        } else if (
          'currentTarget' in eventOrValue &&
          'value' in eventOrValue.currentTarget
        ) {
          changeField(name, eventOrValue.currentTarget.value);
        }
      } else {
        changeField(name, eventOrValue);
      }
    },
    [changeField, name]
  );

  const onBlur = useCallback(() => {
    blurField(name);
  }, [blurField, name]);

  if (!(name in formState.fields)) {
    return null;
  }

  return React.createElement<FieldComponentProps<Fields, Value>>(
    component || 'input',
    {
      ...customProps,
      ...formState.fields[name],
      form: formState,
      onFocus,
      onChange,
      onBlur,
    },
    children
  );
}

export default Field;
