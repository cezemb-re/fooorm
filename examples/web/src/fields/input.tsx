import { useCallback, useEffect } from 'react';
import * as React from 'react';
import { FieldComponentProps } from '@cezembre/form';

export interface Props {
  otherProp?: string;
}

export type Adapter = (event: React.ChangeEvent<HTMLInputElement>) => any;
export type Resolver = (value: any) => string | number;

const defaultAdapter: Adapter = (event: React.ChangeEvent<HTMLInputElement>): string =>
  event?.target?.value || '';

const defaultResolver: Resolver = (value: any): string | number => {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }
  return value;
};

function Input({
  error,
  warning,
  value,
  isValid,
  isActive,
  visited,
  submitted,
  hasChanged,
  name,
  onFocus,
  onChange,
  onBlur,
}: FieldComponentProps & Props): React.ReactElement {
  const customOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      return onChange(defaultAdapter(event));
    },
    [onChange],
  );

  useEffect(() => {
    console.log('Mount field !');
  }, []);

  return (
    <div>
      <label htmlFor={name}>{name}</label>
      <input
        type="text"
        value={defaultResolver(value)}
        onFocus={onFocus}
        onChange={customOnChange}
        onBlur={onBlur}
      />
    </div>
  );
}

export default Input;
