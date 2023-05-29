import { Form, Field, FormSubmitError } from '../src';

interface Props {
  type: 'text' | 'password';
}

export default {
  title: 'Field',
  component: Field,
  argTypes: {},
};

interface Fields {
  test: string;
}

function onSubmit() {
  throw new FormSubmitError<Fields>({ test: 'test' });
}

function Template({ type }: Props) {
  return (
    <Form<Fields> onSubmit={onSubmit}>
      <Field<string, unknown, Fields> name="test" />
      <button type="submit">Submit</button>
    </Form>
  );
}

export const Default = Template.bind({});
