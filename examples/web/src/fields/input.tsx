import React from 'react';
import { FieldComponentProps } from '@cezembre/fooorm';

export interface Props {
  otherProp?: string;
}

function Input({
  error,
  warning,
  submitError,
  value,
  isValid,
  isActive,
  visited,
  isTouched,
  name,
  onFocus,
  onChange,
  onBlur,
  otherProp = 'top',
}: FieldComponentProps & Props): React.ReactElement {
  return (
    <div>
      <label htmlFor={name}>{name}</label>
      <input
        type="text"
        value={value}
        onFocus={onFocus}
        onChange={onChange}
        onBlur={onBlur}
      />
      <p>ERROR: {error}</p>
      <p>WARNING: {warning}</p>
      <p>SUBMIT ERROR: {submitError}</p>
      <p>value: {value}</p>
      <p>isTouched: {isTouched.toString()}</p>
      <p>isActive: {isActive.toString()}</p>
      <p>visited: {visited.toString()}</p>
      <p>isValid: {isValid.toString()}</p>
      <p>{otherProp}</p>
    </div>
  );
}

export default Input;
