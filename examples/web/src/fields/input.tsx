import { useCallback, useEffect, ChangeEvent, ReactElement } from 'react';
import { FieldComponentProps } from '@cezembre/forms';

export interface Props {
  otherProp?: string;
}

export type Adapter = (event: ChangeEvent<HTMLInputElement>) => any;
export type Resolver = (value: any) => string | number;

const defaultAdapter: Adapter = (event: React.ChangeEvent<HTMLInputElement>): string =>
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
