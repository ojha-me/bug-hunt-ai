import {
    Anchor,
    Button,
    Checkbox,
    Group,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
  } from '@mantine/core';
  import type { PaperProps } from '@mantine/core';
  import { useForm } from '@mantine/form';
  import { upperFirst, useToggle } from '@mantine/hooks';
  import { createUser } from '../api/user';
  import type { CreateUserSchema } from '../types/users/api_types';
  import { useMutation } from '@tanstack/react-query';
  import { notifications } from '@mantine/notifications';
  
  export function AuthenticationForm(props: PaperProps) {
    const [type, toggle] = useToggle(['login', 'register']);
    const form = useForm({
      initialValues: {
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        terms: true,
      },
  
      validate: {
        email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
        password: (val) => (val.length <= 6 ? 'Password should include at least 6 characters' : null),
      },
    });

    const mutation = useMutation({
      mutationFn: createUser,
      onSuccess: () => {
        notifications.show({
          title: 'Success!',
          message: 'Your account has been created. You can now log in.',
          color: 'green',
        });
        toggle('login'); 
        form.reset(); 
      },
      onError: (error) => {
        notifications.show({
          title: 'Error',
          message: error.message || 'An unexpected error occurred. Please try again.',
          color: 'red',
        });
      },
    });

    const handleSubmit = (values: typeof form.values) => {
      if (type === 'register') {
        const userData: CreateUserSchema = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          password: values.password,
          skill_level: 'beginner',
        };
        mutation.mutate(userData);
      } else {
        // Here you would handle the login logic, likely with another mutation
        console.log('Logging in with:', values);
        notifications.show({
          title: 'Login Submitted',
          message: 'Login functionality is not yet implemented.',
        });
      }
    };
  
    return (
      <Paper radius="md" p="lg" withBorder {...props}>
        <Text size="lg" fw={500}>
          Welcome to Mantine, {type} with
        </Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {type === 'register' && (
              <>
              <TextInput
                label="First Name"
                placeholder="Your first name"
                value={form.values.first_name}
                onChange={(event) => form.setFieldValue('first_name', event.currentTarget.value)}
                radius="md"
              />
              <TextInput
                label="Last Name"
                placeholder="Your last name"
                value={form.values.last_name}
                onChange={(event) => form.setFieldValue('last_name', event.currentTarget.value)}
                radius="md"
              />
              </>
            )}
  
            <TextInput
              required
              label="Email"
              placeholder="hello@mantine.dev"
              value={form.values.email}
              onChange={(event) => form.setFieldValue('email', event.currentTarget.value)}
              error={form.errors.email && 'Invalid email'}
              radius="md"
            />
  
            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              value={form.values.password}
              onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
              error={form.errors.password && 'Password should include at least 6 characters'}
              radius="md"
            />
  
            {type === 'register' && (
              <Checkbox
                label="I accept terms and conditions"
                checked={form.values.terms}
                onChange={(event) => form.setFieldValue('terms', event.currentTarget.checked)}
              />
            )}
          </Stack>
  
          <Group justify="space-between" mt="xl">
            <Anchor component="button" type="button" c="dimmed" onClick={() => toggle()} size="xs">
              {type === 'register'
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </Anchor>
            <Button type="submit" radius="xl">
              {upperFirst(type)}
            </Button>
          </Group>
        </form>
      </Paper>
    );
  }