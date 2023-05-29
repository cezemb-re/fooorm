import {
  cloneElement,
  createElement,
  ReactElement,
  ReactNode,
  ComponentType,
  useCallback,
  useEffect,
  useRef,
  HTMLInputTypeAttribute,
} from 'react';
import isEqual from 'lodash.isequal';
import { FieldState, FormState, useFormContext, FieldModifier } from './state';

export interface FieldComponentProps<V = unknown, F extends object = Record<string, unknown>>
  extends Partial<FieldState<V>> {
  form: FormState<F>;
  onFocus: () => void;
  onChange: (modifier: FieldModifier<V>) => void;
  onBlur: () => void;
}

export interface FieldProps<V = unknown, P = unknown, F extends object = Record<string, unknown>> {
  name: keyof F;
  initialValue?: V;
  element?: ReactElement;
  component?: ComponentType<FieldComponentProps<V, F> & P> | string;
  onChange?: (value: V) => void;
  children?: ReactNode;
  type?: HTMLInputTypeAttribute;
}

export function Field<V = unknown, P = unknown, F extends object = Record<string, unknown>>({
  name,
  initialValue,
  element,
  component,
  onChange,
  children,
  ...customProps
}: FieldProps<V, P, F> & Omit<P, keyof FieldComponentProps>): ReactElement | null {
  const memoizedName = useRef<keyof F>();
  const memoizedInitialValue = useRef<V>();

  const { formState, mountField, focusField, changeField, blurField } = useFormContext<F>();

  useEffect(() => {
    if (memoizedName.current !== name || !isEqual(memoizedInitialValue.current, initialValue)) {
      mountField(name, initialValue as F[keyof F]);
      memoizedName.current = name;
      memoizedInitialValue.current = initialValue;
    }
  }, [name, initialValue, mountField]);

  const onFocus = useCallback(() => {
    focusField(name);
  }, [focusField, name]);

  const change = useCallback(
    (modifier: FieldModifier<V>) => {
      changeField(name, modifier, onChange);
    },
    [changeField, name, onChange],
  );

  const onBlur = useCallback(() => {
    blurField(name);
  }, [blurField, name]);

  if (!formState.fields || !(name in formState.fields)) {
    return null;
  }

  const field = (formState.fields as { [key: string]: FieldState | undefined })[
    name
  ] as FieldState<V>;

  const props: FieldComponentProps<V, F> & P = {
    ...customProps,
    ...field,
    form: formState,
    onFocus,
    onChange: change,
    onBlur,
  } as FieldComponentProps<V, F> & P;

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
