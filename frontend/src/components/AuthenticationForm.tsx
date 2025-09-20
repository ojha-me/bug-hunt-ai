import {
    Anchor,
    Button,
    Group,
    Paper,
    PasswordInput,
    Select,
    Stack,
    Text,
    TextInput,
  } from '@mantine/core';
  import type { MantineTheme, PaperProps } from '@mantine/core';
  import { useForm } from '@mantine/form';
  import { upperFirst, useToggle } from '@mantine/hooks';
  import { createUser, loginUser } from '../api/user';
  import type { CreateUserSchema, LoginParams } from '../types/users/api_types';
  import { useMutation } from '@tanstack/react-query';
  import { notifications } from '@mantine/notifications';
  

  export function AuthenticationForm(props: PaperProps) {
    const [type, toggle] = useToggle(['login', 'register']);
    const form = useForm<CreateUserSchema>({
      initialValues: {
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        skill_level: 'beginner',
      },
  
      validate: {
        email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
        password: (val) => (val.length <= 6 ? 'Password should include at least 6 characters' : null),
      },
    });

    const createMutation = useMutation({
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

    const loginMutation = useMutation({
      mutationFn: loginUser,
      onSuccess: () => {
        notifications.show({
          title: 'Success!',
          message: 'You have successfully logged in.',
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
          skill_level: values.skill_level,
        };
        createMutation.mutate(userData);
      } else {
        const loginData: LoginParams = {
          email: values.email,
          password: values.password,
        };
        loginMutation.mutate(loginData);
        notifications.show({
          title: 'Login Submitted',
          message: 'Login functionality is not yet implemented.',
        });
      }
    };
  
    return (
      <Paper radius="md" p="lg" {...props} className='max-w-[420px] mx-auto flex flex-col items-cente' styles={(theme: MantineTheme) => ({
        root: {
          border: `2px solid ${theme.colors.dark[4]}`
        }
      })}>
        <Text size="lg" fw={500} className='text-center'>
          Welcome to BugHunt Ai
        </Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {type === 'register' && (
              <>
              <TextInput
                label="First Name"
                placeholder="Your first name"
                value={form.values.first_name}
                {...form.getInputProps('first_name')}
              />
              <TextInput
                label="Last Name"
                placeholder="Your last name"
                {...form.getInputProps('last_name')}
              />
              </>
            )}
  
            <TextInput
              required
              label="Email"
              placeholder="hello@example.com"
              {...form.getInputProps('email')}
            />
            {
              type === 'register' && (
                <Select
              label="Skill Level"
              data={[{value: 'beginner', label: 'Beginner'}, {value: 'intermediate', label: 'Intermediate'}, {value: 'advanced', label: 'Advanced'}]}
              {...form.getInputProps('skill_level')}
            />
              )
            }
            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password')}
            />
  
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