import {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  SyntheticEvent,
  Ref,
  ReactElement,
  ReactNode,
  useMemo,
} from 'react';
import {
  formContext,
  FormState,
  getDefaultFormState,
  FormContext,
  FormSubmitFunction,
  FormValidationFunction,
  FieldModifier,
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

export interface FormProps<F extends object = Record<string, unknown>> {
  onSubmit?: FormSubmitFunction<F>;
  onChange?: FormSubmitFunction<F>;
  validate?: FormValidationFunction<F>;
  warn?: FormValidationFunction<F>;
  liveValidation?: boolean;
  className?: string;
  children?: ReactNode;
}

export const Form = forwardRef(function Form<F extends object = Record<string, unknown>>(
  { onSubmit, onChange, validate, warn, liveValidation = false, className, children }: FormProps<F>,
  ref: Ref<FormContext<F>>,
): ReactElement {
  const [formState, setFormState] = useState<FormState<F>>(getDefaultFormState<F>());

  const mountField = useCallback(
    (name: keyof F, initialValue: unknown) =>
      setFormState((state) => mountFieldAction<F>(state, name, initialValue, validate, warn)),
    [validate, warn],
  );

  const focusField = useCallback(
    (name: keyof F) => setFormState((state) => focusFieldAction(state, name)),
    [],
  );

  const changeField = useCallback(
    (name: keyof F, modifier: FieldModifier, onChangeField?: (value: any) => void) => {
      setFormState((state) =>
        changeFieldAction(
          state,
          name,
          modifier,
          onChange,
          liveValidation,
          validate,
          warn,
          onChangeField,
        ),
      );
    },
    [liveValidation, onChange, validate, warn],
  );

  const blurField = useCallback(
    (name: keyof F) =>
      setFormState((state) => blurFieldAction(state, name, liveValidation, validate, warn)),
    [liveValidation, validate, warn],
  );

  const resetField = useCallback(
    (name: keyof F) =>
      setFormState((state) =>
        resetFieldAction(state, name, onChange, liveValidation, validate, warn),
      ),
    [liveValidation, onChange, validate, warn],
  );

  const submitForm = useCallback(
    async (event?: SyntheticEvent) => {
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
        nextState = await submitAction(formState, onSubmit, validate);

        setFormState(nextState);
      } catch (errors) {
        setFormState(failSubmitAction(formState, errors as Error));
      }
    },
    [formState, onSubmit, validate],
  );

  const resetForm = useCallback(
    () =>
      setFormState((previousState) =>
        resetFormAction(previousState, onChange, validate, warn, liveValidation),
      ),
    [liveValidation, onChange, validate, warn],
  );

  const value = useMemo<FormContext<F>>(
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

  useImperativeHandle<FormContext<F>, FormContext<F>>(ref, () => value, [value]);

  return (
    <formContext.Provider value={value as FormContext}>
      {typeof document !== 'undefined' ? (
        <form onSubmit={submitForm} onReset={resetForm} className={className}>
          {children}
        </form>
      ) : (
        children
      )}
    </formContext.Provider>
  );
}) as <F extends object = Record<string, unknown>>(
  props: FormProps<F> & {
    ref?: Ref<FormContext<F>>;
  },
) => ReactElement;
