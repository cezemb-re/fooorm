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
    async (values) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          // reject(
          //   new FormSubmitError({ _global: 'Failed', two: 'also failed' })
          // );
          resolve(null);
        }, 1000);
      }),
    [],
  );

  const validateField = useCallback((value) => {
    if (value === 'toto') {
      return 'Value should not be toto';
    }
    return null;
  }, []);

  const warnField = useCallback((value) => {
    if (value === 'titi') {
      return 'Value titi can lead to bug';
    }
    return null;
  }, []);

  const warnForm = useCallback((fields: Partial<Fields>): FormErrors<Fields> => {
    const errors: FormErrors<Fields> = {};
    return { _global: 'Carefull with forms !', two: 'Warning from form' };
  }, []);

  return (
    <div className="App">
      <Form<Fields> onSubmit={onSubmit} ref={form} warn={warnForm}>
        <Field
          name="one"
          component={Input}
          otherProp="tralala"
          initialValue="One"
          validate={validateField}
          warn={warnField}
        />
        <Field
          name="two"
          component={Input}
          initialValue="Two"
          validate={validateField}
          warn={warnField}
        />
        <Field
          name="three"
          component={Input}
          initialValue="Three"
          validate={validateField}
          warn={warnField}
        />
        <input type="submit" value="Submit" />
        <input type="reset" value="Reset" />
      </Form>

      <br />
      <br />
      <h6>Form state</h6>
      <p>isSubmitting: {formState.isSubmitting.toString()}</p>
      <p>isTouched: {formState.isTouched.toString()}</p>
      <p>isValid: {formState.isValid.toString()}</p>
      <p>isActive: {formState.isActive.toString()}</p>
      <p>visited: {formState.visited.toString()}</p>
      <p>submitSucceeded: {formState.submitSucceeded.toString()}</p>
      <p>submitFailed: {formState.submitFailed.toString()}</p>
      <p>Error: {formState.error}</p>
      <p>Warning: {formState.warning}</p>
      <p>Submit error: {formState.submitError}</p>
    </div>
  );
}

export default App;
