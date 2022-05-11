import { useRef, ReactElement, useMemo } from 'react';
import { FieldComponentProps } from '../../src';

export type InputType = 'text' | 'password' | 'email' | 'search' | 'url' | 'number' | 'hidden';

export type InputAutoComplete =
  | 'off'
  | 'on'
  | 'name'
  | 'honorific-prefix'
  | 'given-name'
  | 'additional-name'
  | 'family-name'
  | 'honorific-suffix'
  | 'nickname'
  | 'email'
  | 'username'
  | 'new-password'
  | 'current-password'
  | 'one-time-code'
  | 'organization-title'
  | 'organization'
  | 'street-address'
  | 'address-line1'
  | 'address-line2'
  | 'address-line3'
  | 'address-level4'
  | 'address-level3'
  | 'address-level2'
  | 'address-level1'
  | 'country'
  | 'country-name'
  | 'postal-code'
  | 'cc-name'
  | 'cc-additional-name'
  | 'cc-family-name'
  | 'cc-number'
  | 'cc-exp'
  | 'cc-exp-month'
  | 'cc-exp-year'
  | 'cc-csc'
  | 'cc-type'
  | 'transaction-currency'
  | 'transaction-amount'
  | 'language'
  | 'bday'
  | 'bday-day'
  | 'bday-month'
  | 'bday-year'
  | 'sex'
  | 'tel'
  | 'tel-country-code'
  | 'tel-national'
  | 'tel-area-code'
  | 'tel-local'
  | 'tel-extension'
  | 'impp'
  | 'url'
  | 'photo';

export interface Props extends FieldComponentProps<string> {
  type?: InputType | string;
  label?: string;
  placeholder?: string;
  autoComplete?: InputAutoComplete | string;
  spellCheck?: boolean;
  autoCorrect?: boolean;
  autoCapitalize?: string;
  prefix?: string;
}

export default function Input({
  value,
  error,
  warning,
  isActive,
  visited,
  submitted,
  onFocus,
  name,
  onChange,
  onBlur,
  type = 'text',
  label,
  placeholder,
  autoComplete = 'on',
  spellCheck = true,
  autoCorrect = true,
  autoCapitalize = 'off',
  prefix,
}: Props): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  const className = useMemo<string>(() => {
    let res = 'input';

    if (visited) {
      res += ' visited';
    }
    if (isActive) {
      res += ' active';
    }

    if ((visited || submitted) && !isActive && error) {
      res += ' error';
    }
    if (warning) {
      res += ' warning';
    }
    return res;
  }, [error, isActive, submitted, visited, warning]);

  return (
    <div className={className}>
      {label ? <label htmlFor={name}>{label}</label> : null}

      <div className={`container${isActive ? ' active' : ''}`}>
        <input
          ref={inputRef}
          name={name}
          value={value || ''}
          type={type || 'text'}
          placeholder={placeholder || ''}
          autoComplete={autoComplete || 'off'}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={onChange}
          spellCheck={spellCheck}
          autoCorrect={autoCorrect ? 'on' : 'off'}
          autoCapitalize={autoCapitalize}
        />
        {prefix ? <span className="prefix">{prefix}</span> : null}
      </div>

      {(visited || submitted) && !isActive && error ? <span className="error">{error}</span> : null}

      {warning ? (
        <div className="warning">
          <span>{warning}</span>
        </div>
      ) : null}
    </div>
  );
}
