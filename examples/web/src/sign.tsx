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

    if (!body.name) {
      errors.name = 'Entrez un nom';
    }

    return errors;
  }, []);

  return (
    <Form<Fields> ref={form} onSubmit={onSubmit} validate={validate}>
      <br />
      <Field name="name" component={Input} label="Name" />
      <br />
      <Field name="other" component={Input} label="Other" />
      <br />
      <Field name="text" component={Select} label="Text" />
      <br />
      <br />

      <input type="submit" value="Submit" />
      <input type="reset" value="Reset" />
    </Form>
  );
}
