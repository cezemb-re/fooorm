import { ComponentStory, ComponentMeta } from '@storybook/react';
import { JSXElementConstructor } from 'react';
import Form from '../src/form';
import { Field, FormSubmitError } from '../src';
import Input from './fields/input';

interface Props {
  type: 'text' | 'password';
}

export default {
  title: 'Field',
  component: Field,
  argTypes: {},
} as ComponentMeta<JSXElementConstructor<Props>>;

function onSubmit() {
  console.log('Here');
  throw new FormSubmitError({ test: 'test' });
}

const Template: ComponentStory<JSXElementConstructor<Props>> = ({ type }: Props) => (
  <Form onSubmit={onSubmit}>
    <Field name="test" component={Input} />
    <button type="submit">Submit</button>
  </Form>
);

export const Default = Template.bind({});

Default.args = {};
