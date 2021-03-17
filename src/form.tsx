import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  SyntheticEvent,
} from 'react';
import formContext, {
  FormState,
  getDefaultFormState,
  FormFields,
  FormContext,
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
  checkSubmitAction,
  startSubmitAction,
  submitAction,
  failSubmitAction,
} from './actions';

export interface FormProps<Fields extends FormFields = FormFields> {
  onSubmit?: FormSubmitFunction<Fields>;
  validate?: FormValidationFunction<Fields>;
  warn?: FormValidationFunction<Fields>;
  liveValidation?: boolean;
  children?: any;
}

function Form<Fields extends FormFields = FormFields>(
  {
    onSubmit,
    validate,
    warn,
    liveValidation = false,
    children,
  }: FormProps<Fields>,
  ref: React.Ref<FormContext<Fields>>
): React.ReactElement {
  const [formState, setFormState] = useState<FormState<Fields>>({
    ...getDefaultFormState<Fields>(),
    onSubmit,
    validate,
    warn,
    liveValidation,
  });

  const mountField = useCallback(
    (name: keyof Fields, initialValue: any) =>
      setFormState((_formState) =>
        mountFieldAction<Fields>(_formState, name, initialValue)
      ),
    []
  );

  const focusField = useCallback(
    (name: keyof Fields) =>
      setFormState((_formState) => focusFieldAction(_formState, name)),
    []
  );

  const changeField = useCallback(
    (name: keyof Fields, value: any) =>
      setFormState((_formState) => changeFieldAction(_formState, name, value)),
    []
  );

  const blurField = useCallback(
    (name: keyof Fields) =>
      setFormState((_formState) => blurFieldAction(_formState, name)),
    []
  );

  const resetField = useCallback(
    (name: keyof Fields) =>
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

      try {
        checkSubmitAction(formState);

        setFormState(startSubmitAction);

        setFormState(await submitAction(formState));
      } catch (errors) {
        setFormState((_formState) => failSubmitAction(_formState, errors));
      }
    },
    [formState]
  );

  const resetForm = useCallback(() => setFormState(resetFormAction), []);

  useImperativeHandle<FormContext<Fields>, FormContext<Fields>>(
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
      value={
        {
          formState,
          mountField,
          focusField,
          changeField,
          blurField,
          resetField,
          submitForm,
          resetForm,
        } as FormContext<Fields>
      }
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

export default forwardRef(Form) as <Fields extends FormFields = FormFields>(
  props: FormProps<Fields> & {
    ref?: React.Ref<FormContext<Fields>>;
  }
) => React.ReactElement;
