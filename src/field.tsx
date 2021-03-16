import React, { useCallback, useEffect } from 'react';
import {
  FieldState,
  FormState,
  useFormContext,
  FieldValidationFunction,
} from './state';

export interface FieldComponentProps extends FieldState {
  form: FormState;
  onFocus: () => void;
  onChange: (eventOrValue: any) => void;
  onBlur: () => void;
}

export interface FieldProps {
  name: string;
  initialValue?: any;
  component?: string | React.ComponentType<FieldComponentProps>;
  validate?: FieldValidationFunction;
  warn?: FieldValidationFunction;
  children?: React.ReactNode[];
  [key: string]: any;
}

function Field({
  name,
  initialValue,
  validate,
  warn,
  component,
  children,
  ...customProps
}: FieldProps): React.ReactElement | null {
  const {
    formState,
    mountField,
    focusField,
    changeField,
    blurField,
  } = useFormContext();

  useEffect(() => {
    mountField(name, initialValue, validate, warn);
  }, [name, initialValue, validate, warn]);

  const onFocus = useCallback(() => {
    focusField(name);
  }, [name]);

  const onChange = useCallback(
    (eventOrValue: any) => {
      if ('target' in eventOrValue && 'value' in eventOrValue.target) {
        changeField(name, eventOrValue.target.value);
      } else if (
        'currentTarget' in eventOrValue &&
        'value' in eventOrValue.currentTarget
      ) {
        changeField(name, eventOrValue.currentTarget.value);
      } else {
        changeField(name, eventOrValue);
      }
    },
    [name]
  );

  const onBlur = useCallback(() => {
    blurField(name);
  }, [name]);

  if (!(name in formState.fields)) {
    return null;
  }

  return React.createElement<FieldComponentProps>(
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
