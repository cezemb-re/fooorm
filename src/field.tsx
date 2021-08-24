import {
  createElement,
  ReactElement,
  ReactNode,
  ComponentType,
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import isEqual from 'lodash.isequal';
import { FieldState, FormState, useFormContext, FormFields } from './state';

export interface FieldComponentProps<Value = any, Fields extends FormFields = FormFields>
  extends Partial<FieldState<Value>> {
  form: FormState<Fields>;
  onFocus: () => void;
  onChange: (eventOrValue: ChangeEvent<{ value: Value }> | Value) => void;
  onBlur: () => void;
  [key: string]: any; // Custom Props
}

export interface FieldProps<Value = any, Fields extends FormFields = FormFields> {
  name: keyof Fields;
  initialValue?: Value;
  component?: string | ComponentType<FieldComponentProps<Value, Fields>>;
  children?: ReactNode[];
  [key: string]: any;
}

export default function Field<Value = any, Fields extends FormFields = FormFields>({
  name,
  initialValue,
  component,
  children,
  ...customProps
}: FieldProps<Value, Fields>): ReactElement | null {
  const memoizedName = useRef<keyof Fields>();
  const memoizedInitialValue = useRef<Value>();

  const { formState, mountField, focusField, changeField, blurField } = useFormContext<Fields>();

  useEffect(() => {
    if (memoizedName.current !== name || !isEqual(memoizedInitialValue.current, initialValue)) {
      mountField(name, initialValue);
      memoizedName.current = name;
      memoizedInitialValue.current = initialValue;
    }
  }, [name, initialValue, mountField]);

  const onFocus = useCallback(() => {
    focusField(name);
  }, [focusField, name]);

  const onChange = useCallback(
    (eventOrValue: ChangeEvent<{ value: Value }> | Value) => {
      if (
        typeof eventOrValue === 'object' &&
        eventOrValue &&
        'target' in eventOrValue &&
        eventOrValue.target &&
        'value' in eventOrValue.target
      ) {
        changeField(name, eventOrValue.target.value);
      } else if (
        typeof eventOrValue === 'object' &&
        eventOrValue &&
        'currentTarget' in eventOrValue &&
        eventOrValue.currentTarget &&
        'value' in eventOrValue.currentTarget
      ) {
        changeField(name, eventOrValue.currentTarget.value);
      } else {
        changeField(name, eventOrValue);
      }
    },
    [changeField, name],
  );

  const onBlur = useCallback(() => {
    blurField(name);
  }, [blurField, name]);

  if (!(name in formState.fields)) {
    return null;
  }

  if (component) {
    return createElement<FieldComponentProps<Value, Fields>>(
      component,
      {
        ...customProps,
        ...formState.fields[name],
        form: formState,
        onFocus,
        onChange,
        onBlur,
      },
      children,
    );
  }

  return createElement('input', {
    ...customProps,
    name,
    value: formState.fields[name]?.value,
    onFocus,
    onChange,
    onBlur,
  });
}
