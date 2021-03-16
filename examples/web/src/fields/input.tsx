import React from 'react';
import { FieldComponentProps } from '@cezembre/fooorm';

export interface Props {
  otherProp?: string;
}

function Input({
  field,
  onFocus,
  onChange,
  onBlur,
  otherProp = 'top',
}: FieldComponentProps & Props): React.ReactElement {
  return (
    <div>
      <label htmlFor={field.name}>{field.name}</label>
      <input
        type="text"
        value={field.value}
        onFocus={onFocus}
        onChange={onChange}
        onBlur={onBlur}
      />
      {field.error ? <p>ERROR: {field.error}</p> : null}
      {field.warning ? <p>WARNING: {field.warning}</p> : null}
      {field.submitError ? <p>SUBMIT ERROR: {field.submitError}</p> : null}
      <p>value: {field.value}</p>
      <p>isTouched: {field.isTouched.toString()}</p>
      <p>isActive: {field.isActive.toString()}</p>
      <p>isValid: {field.isValid.toString()}</p>
      <p>{otherProp}</p>
    </div>
  );
}

export default Input;
