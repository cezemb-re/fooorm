import React, { useCallback, useState } from 'react';
import './App.css';
import {
  Form,
  Field,
  FormState,
  defaultFormState,
  FormSubmitError,
} from '@cezembre/fooorm';
import Input from './fields/input';

function App(): React.ReactElement {
  const [formState, setFormState] = useState<FormState>(defaultFormState);

  const form = useCallback((formContext) => {
    if (formContext) {
      setFormState(formContext.formState);
    }
  }, []);

  const onSubmit = useCallback(
    async (values) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new FormSubmitError({ two: 'Bug' }));
          // resolve(null);
        }, 1000);
      }),
    []
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

  return (
    <div className="App">
      <Form onSubmit={onSubmit} ref={form}>
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
      <p>submitSucceeded: {formState.submitSucceeded.toString()}</p>
      <p>submitFailed: {formState.submitFailed.toString()}</p>
      <p>Submit error: {formState.submitErrors._global?.toString()}</p>
    </div>
  );
}

export default App;
