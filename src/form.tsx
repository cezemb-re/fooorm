import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  SyntheticEvent,
} from 'react';
import formContext, {
  FormState,
  defaultFormState,
  FormFields,
  FormContext,
  FieldValidationFunction,
  FormSubmitFunction,
  FormValidationFunction,
} from './state';
import {
  mountFieldAction,
  focusFieldAction,
  blurFieldAction,
  changeFieldAction,
  resetFieldAction,
  resetFormAction,
  startSubmitAction,
  submitAction,
  failSubmitAction,
} from './actions';

export interface FormProps<Fields extends FormFields = FormFields> {
  onSubmit?: FormSubmitFunction<Fields>;
  validate?: FormValidationFunction<Fields>;
  warn?: FormValidationFunction<Fields>;
  onStateChange?: () => FormState;
  children?: any;
}

function Form(
  { onSubmit, validate, warn, onStateChange, children }: FormProps,
  ref: React.Ref<FormContext>
): React.ReactElement {
  const [formState, setFormState] = useState<FormState>({
    ...defaultFormState,
    onSubmit,
    validate,
    warn,
  });

  const mountField = useCallback(
    (
      name: string,
      initialValue: any,
      validate: FieldValidationFunction | undefined,
      warn: FieldValidationFunction | undefined
    ) =>
      setFormState((formState) =>
        mountFieldAction(formState, name, initialValue, validate, warn)
      ),
    []
  );

  const focusField = useCallback(
    (name: string) =>
      setFormState((formState) => focusFieldAction(formState, name)),
    []
  );

  const changeField = useCallback(
    (name: string, value: any) =>
      setFormState((formState) => changeFieldAction(formState, name, value)),
    []
  );

  const blurField = useCallback(
    (name: string) =>
      setFormState((formState) => blurFieldAction(formState, name)),
    []
  );

  const resetField = useCallback(
    (name: string) =>
      setFormState((formState) => resetFieldAction(formState, name)),
    []
  );

  const submitForm = useCallback(
    async (event: SyntheticEvent | undefined) => {
      if (
        event &&
        'preventDefault' in event &&
        typeof event.preventDefault === 'function' &&
        event.preventDefault
      ) {
        event.preventDefault();
      }

      if (!formState.isValid) {
        return;
      }

      setFormState(startSubmitAction);

      try {
        setFormState(await submitAction(formState));
      } catch (errors) {
        setFormState((formState) => failSubmitAction(formState, errors));
      }
    },
    [formState]
  );

  const resetForm = useCallback(() => setFormState(resetFormAction), []);

  useImperativeHandle(
    ref,
    () => ({
      formState,
      mountField,
      focusField,
      changeField,
      blurField,
      resetField,
      submitForm,
      resetForm,
    }),
    [
      formState,
      mountField,
      focusField,
      changeField,
      blurField,
      resetField,
      submitForm,
      resetForm,
    ]
  );

  return (
    <formContext.Provider
      value={{
        formState,
        mountField,
        focusField,
        changeField,
        blurField,
        resetField,
        submitForm,
        resetForm,
      }}
    >
      {typeof document !== 'undefined' ? (
        <form onSubmit={submitForm} onReset={resetForm}>
          {children}
        </form>
      ) : (
        children
      )}
    </formContext.Provider>
  );
}

export default forwardRef(Form);
