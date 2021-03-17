import React from 'react';
import { FieldComponentProps } from '../../../../lib';

function Select({ value, onChange }: FieldComponentProps): React.ReactElement {
  return (
    <div>
      <p>value: {JSON.stringify(value)}</p>
      <button type="button" onClick={() => onChange({ toto: 'titi' })}>
        Ok
      </button>
    </div>
  );
}

export default Select;
