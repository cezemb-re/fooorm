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
      validateField: FieldValidationFunction | undefined,
      warnField: FieldValidationFunction | undefined
    ) =>
      setFormState((_formState) =>
        mountFieldAction(
          _formState,
          name,
          initialValue,
          validateField,
          warnField
        )
      ),
    []
  );

  const focusField = useCallback(
    (name: string) =>
      setFormState((_formState) => focusFieldAction(_formState, name)),
    []
  );

  const changeField = useCallback(
    (name: string, value: any) =>
      setFormState((_formState) => changeFieldAction(_formState, name, value)),
    []
  );

  const blurField = useCallback(
    (name: string) =>
      setFormState((_formState) => blurFieldAction(_formState, name)),
    []
  );

  const resetField = useCallback(
    (name: string) =>
      setFormState((_formState) => resetFieldAction(_formState, name)),
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
        setFormState((_formState) => failSubmitAction(_formState, errors));
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
