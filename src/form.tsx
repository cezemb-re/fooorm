import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  SyntheticEvent,
  useEffect,
  Ref,
  ReactElement,
  ReactNode,
  Context,
  useMemo,
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
  children?: ReactNode;
}

function Form<F extends FormFields = FormFields, V = unknown>(
  { onSubmit, onChange, validate, warn, liveValidation = false, className, children }: FormProps<F>,
  ref: Ref<FormContext<F, V>>,
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
    (name: keyof F, initialValue: unknown) =>
      setFormState((state) => mountFieldAction<F>(state, name, initialValue)),
    [],
  );

  const focusField = useCallback(
    (name: keyof F) => setFormState((state) => focusFieldAction(state, name)),
    [],
  );

  const changeField = useCallback((name: keyof F, value: unknown) => {
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

  const context = formContext as Context<FormContext<F, V>>;

  const value = useMemo<FormContext<F, V>>(
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
    [blurField, changeField, focusField, formState, mountField, resetField, resetForm, submitForm],
  );

  useImperativeHandle<FormContext<F, V>, FormContext<F, V>>(ref, () => value, [value]);

  return (
    <context.Provider value={value}>
      {typeof document !== 'undefined' ? (
        <form onSubmit={submitForm} onReset={resetForm} className={className}>
          {children}
        </form>
      ) : (
        children
      )}
    </context.Provider>
  );
}

export default forwardRef(Form) as <F extends FormFields = FormFields, V = unknown>(
  props: FormProps<F> & {
    ref?: Ref<FormContext<F, V>>;
  },
) => ReactElement;
