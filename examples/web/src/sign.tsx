import { ReactElement, useCallback, useState } from 'react';
import { Form, Field, FormState, getDefaultFormState, FormErrors } from '@cezembre/forms';
import Input from './fields/input';
import { Select } from '@cezembre/ui';

export interface Fields {
  name?: string;
  other?: string;
  text?: string;
}

export default function Sign(): ReactElement {
  const [formState, setFormState] = useState<FormState<Fields>>(getDefaultFormState<Fields>());

  const form = useCallback((formContext) => {
    if (formContext) {
      setFormState(formContext.formState);
    }
  }, []);

  const onSubmit = useCallback((fields: Fields) => {
    console.log(fields);
  }, []);

  const validate = useCallback((body: Fields): FormErrors<Fields> => {
    const errors: FormErrors<Fields> = {};

    return errors;
  }, []);

  return (
    <Form<Fields> ref={form} onSubmit={onSubmit} validate={validate}>
      <br />
      <Field name="league" component={Input} label="League" />
      <br />
      <Field name="club" component={Input} label="Club" />
      <br />
      <Field name="player" component={Input} label="Player" />
      <br />
      <br />

      <input type="submit" value="Submit" />
      <input type="reset" value="Reset" />
    </Form>
  );
}
