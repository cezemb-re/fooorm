import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  SyntheticEvent,
  useEffect,
  Ref,
  ReactElement,
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
  startSubmitAction,
  submitAction,
  failSubmitAction,
} from './actions';

export interface FormProps<F extends FormFields = FormFields> {
  onSubmit?: FormSubmitFunction<F>;
  onChange?: FormSubmitFunction<F>;
  validate?: FormValidationFunction<F>;
  warn?: FormValidationFunction<F>;
  liveValidation?: boolean;
  className?: string;
  children?: any;
}

function Form<F extends FormFields = FormFields>(
  {
    onSubmit,
    onChange,
    validate,
    warn,
    liveValidation = false,
    className = undefined,
    children,
  }: FormProps<F>,
  ref: Ref<FormContext<F>>,
): ReactElement {
  const [formState, setFormState] = useState<FormState<F>>({
    ...getDefaultFormState<F>(),
    onSubmit,
    onChange,
    validate,
    warn,
    liveValidation,
  });

  useEffect(() => {
    setFormState((lastState) => ({
      ...lastState,
      onSubmit,
      onChange,
      validate,
      warn,
      liveValidation,
    }));
  }, [onSubmit, onChange, validate, warn, liveValidation]);

  const mountField = useCallback(
    (name: keyof F, initialValue: any) =>
      setFormState((state) => mountFieldAction<F>(state, name, initialValue)),
    [],
  );

  const focusField = useCallback(
    (name: keyof F) => setFormState((state) => focusFieldAction(state, name)),
    [],
  );

  const changeField = useCallback((name: keyof F, value: any) => {
    setFormState((state) => changeFieldAction(state, name, value));
  }, []);

  const blurField = useCallback(
    (name: keyof F) => setFormState((state) => blurFieldAction(state, name)),
    [],
  );

  const resetField = useCallback(
    (name: keyof F) => setFormState((state) => resetFieldAction(state, name)),
    [],
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

      let nextState = startSubmitAction(formState);

      setFormState(nextState);

      try {
        nextState = await submitAction(formState);

        setFormState(nextState);
      } catch (errors) {
        setFormState(failSubmitAction(formState, errors as Error));
      }
    },
    [formState],
  );

  const resetForm = useCallback(() => setFormState(resetFormAction), []);

  useImperativeHandle<FormContext<F>, FormContext<F>>(
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
    [formState, mountField, focusField, changeField, blurField, resetField, submitForm, resetForm],
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
        } as FormContext<F>
      }>
      {typeof document !== 'undefined' ? (
        <form onSubmit={submitForm} onReset={resetForm} className={className}>
          {children}
        </form>
      ) : (
        children
      )}
    </formContext.Provider>
  );
}

export default forwardRef(Form) as <F extends FormFields = FormFields>(
  props: FormProps<F> & {
    ref?: Ref<FormContext<F>>;
  },
) => ReactElement;
