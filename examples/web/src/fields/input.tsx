import React from 'react';
import { FieldComponentProps } from '@cezembre/fooorm';

function Input({
  field,
  onFocus,
  onChange,
  onBlur,
}: FieldComponentProps): React.ReactElement {
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
    </div>
  );
}

export default Input;
