import {
  cloneElement,
  createElement,
  ReactElement,
  ReactNode,
  ComponentType,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import isEqual from 'lodash.isequal';
import { FieldState, FormState, useFormContext, FormFields, FieldModifier } from './state';

export interface FieldComponentProps<FF extends FormFields, F extends keyof FF>
  extends Partial<FieldState<FF[F]>> {
  form: FormState<FF>;
  onFocus: () => void;
  onChange: (modifier: FieldModifier<FF[F]>) => void;
  onBlur: () => void;
  [key: string]: unknown; // Custom Props
}

export interface FieldProps<FF extends FormFields, F extends keyof FF> {
  name: keyof FF;
  initialValue?: FF[F];
  element?: ReactElement;
  component?: ComponentType<FieldComponentProps<FF, F>> | string;
  onChange?: (value: FF[F]) => void;
  children?: ReactNode;
  [key: string]: unknown;
}

export function Field<FF extends FormFields, F extends keyof FF>({
  name,
  initialValue,
  element,
  component,
  onChange,
  children,
  ...customProps
}: FieldProps<FF, F>): ReactElement | null {
  const memoizedName = useRef<keyof FF>();
  const memoizedInitialValue = useRef<FF[F]>();

  const { formState, mountField, focusField, changeField, blurField } = useFormContext<FF>();

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

  const change = useCallback(
    (modifier: FieldModifier<FF[F]>) => {
      changeField<F>(name, modifier, onChange);
    },
    [changeField, name, onChange],
  );

  const onBlur = useCallback(() => {
    blurField(name);
  }, [blurField, name]);

  if (!formState.fields || !(name in formState.fields)) {
    return null;
  }

  const field = (formState.fields as { [key: string]: FieldState | undefined })[name] as FieldState<
    FF[F]
  >;

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
