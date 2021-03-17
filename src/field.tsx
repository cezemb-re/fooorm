import React, { useCallback, useEffect, useRef } from 'react';
import isEqual from 'lodash.isequal';
import { FieldState, FormState, useFormContext, FormFields } from './state';

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
  children?: React.ReactNode[];
  [key: string]: any;
}

function Field<Fields extends FormFields = FormFields, Value = any>({
  name,
  initialValue,
  component,
  children,
  ...customProps
}: FieldProps<Fields, Value>): React.ReactElement | null {
  const memoizedName = useRef<keyof Fields>();
  const memoizedInitialValue = useRef<Value>();

  const {
    formState,
    mountField,
    focusField,
    changeField,
    blurField,
  } = useFormContext<Fields>();

  useEffect(() => {
    if (
      memoizedName.current !== name ||
      !isEqual(memoizedInitialValue.current, initialValue)
    ) {
      mountField(name, initialValue);
      memoizedName.current = name;
      memoizedInitialValue.current = initialValue;
    }
  }, [name, initialValue, mountField]);

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
