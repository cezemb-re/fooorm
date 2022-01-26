import {
  cloneElement,
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

export interface FieldComponentProps<V = unknown, F extends FormFields = FormFields>
  extends Partial<FieldState<V>> {
  form: FormState<F>;
  onFocus: () => void;
  onChange: (eventOrValue: ChangeEvent<{ value: V }> | V) => void;
  onBlur: () => void;
  [key: string]: unknown; // Custom Props
}

export interface FieldProps<V = unknown, F extends FormFields = FormFields> {
  name: keyof F;
  initialValue?: V;
  element?: ReactElement;
  component?: ComponentType<FieldComponentProps<V, F>> | string;
  onChange?: (value: V) => void;
  children?: ReactNode;
  [key: string]: unknown;
}

export default function Field<V = unknown, F extends FormFields = FormFields>({
  name,
  initialValue,
  element,
  component,
  onChange,
  children,
  ...customProps
}: FieldProps<V, F>): ReactElement | null {
  const memoizedName = useRef<keyof F>();
  const memoizedInitialValue = useRef<V>();

  const { formState, mountField, focusField, changeField, blurField } = useFormContext<F>();

  useEffect(() => {
    if (
      mountField &&
      (memoizedName.current !== name || !isEqual(memoizedInitialValue.current, initialValue))
    ) {
      mountField(name, initialValue);
      memoizedName.current = name;
      memoizedInitialValue.current = initialValue;
    }
  }, [name, initialValue, mountField]);

  const onFocus = useCallback(() => {
    if (focusField) {
      focusField(name);
    }
  }, [focusField, name]);

  const change = useCallback(
    (eventOrValue: ChangeEvent<{ value: V }> | V) => {
      if (!changeField) {
        return;
      }
      let value: V;
      if (
        typeof eventOrValue === 'object' &&
        eventOrValue &&
        'target' in eventOrValue &&
        eventOrValue.target &&
        'value' in eventOrValue.target
      ) {
        value = eventOrValue.target.value;
      } else if (
        typeof eventOrValue === 'object' &&
        eventOrValue &&
        'currentTarget' in eventOrValue &&
        eventOrValue.currentTarget &&
        'value' in eventOrValue.currentTarget
      ) {
        value = eventOrValue.currentTarget.value;
      } else {
        value = eventOrValue as V;
      }
      changeField(name, value);
      if (onChange) {
        onChange(value);
      }
    },
    [changeField, name, onChange],
  );

  const onBlur = useCallback(() => {
    if (blurField) {
      blurField(name);
    }
  }, [blurField, name]);

  if (!formState.fields || !(name in formState.fields)) {
    return null;
  }

  const field = formState.fields[name] as FieldState<V>;

  const props = {
    ...customProps,
    ...field,
    form: formState,
    onFocus,
    onChange: change,
    onBlur,
  };

  if (element) {
    return cloneElement(element, props, children);
  }

  if (component) {
    return createElement(component, props, children);
  }

  return createElement('input', {
    ...customProps,
    name,
    value: field?.value,
    onFocus,
    onChange: change,
    onBlur,
  });
}
