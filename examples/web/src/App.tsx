import React, { useCallback, useState } from 'react';
import './App.css';
import {
  Form,
  Field,
  FormState,
  FormSubmitError,
  FormErrors,
  getDefaultFormState,
  FormFields,
} from '@cezembre/fooorm';
import Input from './fields/input';
import Select from './fields/select';

export interface Fields {
  one: string;
  two: string;
  three: string;
}

// const MyForm = () => Form<Fields>();

function App(): React.ReactElement {
  const [formState, setFormState] = useState<FormState>(getDefaultFormState());

  const form = useCallback((formContext) => {
    if (formContext) {
      setFormState(formContext.formState);
    }
  }, []);

  const onSubmit = useCallback(
    async (values, changes) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('Submuted !');
          // reject(new FormSubmitError({ _global: 'Failed', two: 'also failed' }));
          resolve(null);
        }, 1000);
      }),
    [],
  );

  const validateForm = useCallback((fields: Partial<Fields>): FormErrors<Fields> => {
    const errors: FormErrors<Fields> = {};
    if (!fields.two?.length) {
      return { two: 'Two enpty !' };
    }
    return {};
  }, []);

  return (
    <div className="App">
      <Form<Fields> onSubmit={onSubmit} ref={form} validate={validateForm}>
        <Field name="three" component={Select} initialValue={{ test: 'lol' }} />

        <input type="submit" value="Submit" />
        <input type="reset" value="Reset" />
      </Form>

      <br />
      <br />
      <h6>Form state</h6>
      <p>submitCounter: {formState.submitCounter}</p>
      <p>isSubmitting: {formState.isSubmitting.toString()}</p>
      <p>hasChanged: {formState.hasChanged.toString()}</p>
      <p>isValid: {formState.isValid.toString()}</p>
      <p>isActive: {formState.isActive.toString()}</p>
      <p>visited: {formState.visited.toString()}</p>
      <p>submitSucceeded: {formState.submitSucceeded.toString()}</p>
      <p>submitFailed: {formState.submitFailed.toString()}</p>
      <p>Error: {formState.error}</p>
      <p>Warning: {formState.warning}</p>
      <p>Error: {JSON.stringify(formState.errors)}</p>
      <p>Changes: {JSON.stringify(formState.changes)}</p>
    </div>
  );
}

export default App;
