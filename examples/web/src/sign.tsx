import { ReactElement, useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Field, FormState, getDefaultFormState } from '@cezembre/form';
import Input from './fields/input';

export interface Fields {
  email: string;
}

export default function Sign(): ReactElement {
  const [formState, setFormState] = useState<FormState<Fields>>(getDefaultFormState<Fields>());

  const form = useCallback((formContext) => {
    if (formContext) {
      setFormState(formContext.formState);
    }
  }, []);

  const history = useHistory();

  const onSubmit = useCallback(
    (fields: Fields) => {
      console.log(fields);
      if (fields.email && fields.email.length) {
        history.push({ pathname: '/profile' });
      }
    },
    [history],
  );

  return (
    <Form<Fields> ref={form} onSubmit={onSubmit}>
      <Field name="email" component={Input} initialValue={undefined} />

      <input type="submit" value="Submit" />
      <input type="reset" value="Reset" />
    </Form>
  );
}
