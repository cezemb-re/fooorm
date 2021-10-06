import { useCallback, ChangeEvent, ReactElement } from 'react';
import { FieldComponentProps } from '@cezembre/forms';

export interface Props {
  otherProp?: string;
}

export type Adapter = (event: ChangeEvent<HTMLInputElement>) => any;
export type Resolver = (value: any) => string | number;

const defaultAdapter: Adapter = (event: ChangeEvent<HTMLInputElement>): string =>
  event?.target?.value || '';

const defaultResolver: Resolver = (value: any): string | number => {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }
  return value;
};

export default function Input({
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
}: FieldComponentProps & Props): ReactElement {
  const customOnChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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
      <br />
      visited: {visited ? 'yes' : 'no'}
      <br />
      submitted: {submitted ? 'yes' : 'no'}
      <br />
      isActive: {isActive ? 'yes' : 'no'}
      <br />
      {(visited || submitted) && !isActive && error ? <p>error: {error}</p> : null}
      {warning && <p>warning: {warning}</p>}
    </div>
  );
}
