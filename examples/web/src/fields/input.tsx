import React, { useCallback } from 'react';
import { FieldComponentProps } from '@cezembre/fooorm';

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
  submitError,
  value,
  isValid,
  isActive,
  visited,
  hasChanged,
  name,
  onFocus,
  onChange,
  onBlur,
  otherProp = 'top',
}: FieldComponentProps & Props): React.ReactElement {
  const customOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      return onChange(defaultAdapter(event));
    },
    [onChange],
  );

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
      <p>ERROR: {error}</p>
      <p>WARNING: {warning}</p>
      <p>SUBMIT ERROR: {submitError}</p>
      <p>value: {value}</p>
      <p>hasChanged: {hasChanged.toString()}</p>
      <p>isActive: {isActive.toString()}</p>
      <p>visited: {visited.toString()}</p>
      <p>isValid: {isValid.toString()}</p>
      <p>{otherProp}</p>
    </div>
  );
}

export default Input;
