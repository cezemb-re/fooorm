import { ReactElement } from 'react';
import { FieldComponentProps } from '@cezembre/form';

export default function Select({ value, onChange }: FieldComponentProps): ReactElement {
  return (
    <div>
      <p>value: {JSON.stringify(value)}</p>
      <button type="button" onClick={() => onChange({ toto: 'titi' })}>
        Ok
      </button>
    </div>
  );
}
