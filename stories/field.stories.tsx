import { Form, Field, FormSubmitError } from '../src';

interface Props {
  type: 'text' | 'password';
}

export default {
  title: 'Field',
  component: Field,
  argTypes: {},
};

function onSubmit() {
  throw new FormSubmitError({ test: 'test' });
}

function Template({ type }: Props) {
  return (
    <Form onSubmit={onSubmit}>
      <Field name="test" />
      <button type="submit">Submit</button>
    </Form>
  );
}

export const Default = Template.bind({});
