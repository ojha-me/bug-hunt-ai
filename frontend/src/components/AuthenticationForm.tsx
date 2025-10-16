import {
    Anchor,
    Button,
    Group,
    Paper,
    PasswordInput,
    Select,
    Text,
    Stack,
    TextInput,
    Container,
    Title,
    Box,
    Divider,
} from '@mantine/core';
import type { PaperProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { upperFirst, useToggle } from '@mantine/hooks';
import { createUser, loginUser, googleAuth } from '../api/user';
import type { CreateUserSchema, LoginParams } from '../types/users/api_types';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '../api/apiClient';
import { notifications } from '@mantine/notifications';
import { FaBug, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

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

    const navigate = useNavigate();

  const loginMutation = useMutation({
      mutationFn: loginUser,
      onSuccess: (data) => {
        setAccessToken(data.access_token);
        notifications.show({
          title: 'Success!',
          message: 'You have successfully logged in.',
          color: 'green',
        });
        navigate('/');
      },
      onError: (error) => {
        notifications.show({
          title: 'Error',
          message: error.message || 'Invalid email or password.',
          color: 'red',
        });
      },
    });

    const googleAuthMutation = useMutation({
      mutationFn: googleAuth,
      onSuccess: (data) => {
        setAccessToken(data.access_token);
        notifications.show({
          title: 'Success!',
          message: 'You have successfully signed in with Google.',
          color: 'green',
        });
        navigate('/');
      },
      onError: (error) => {
        notifications.show({
          title: 'Error',
          message: error.message || 'Google sign-in failed.',
          color: 'red',
        });
      },
    });

    const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
      if (credentialResponse.credential) {
        googleAuthMutation.mutate(credentialResponse.credential);
      }
    };

    const handleGoogleError = () => {
      notifications.show({
        title: 'Error',
        message: 'Google sign-in was cancelled or failed.',
        color: 'red',
      });
    };

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
      }
    };
  
    return (
      <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box style={{ width: '100%', maxWidth: 480 }}>
          <Box style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Box style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '1rem',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
            }}>
              <FaBug size={40} color="white" />
            </Box>
            <Title order={1} style={{ 
              fontSize: '2rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              BugHunt AI
            </Title>
            <Text size="md" c="dimmed">
              {type === 'login' ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
            </Text>
          </Box>

          <Paper 
            radius="xl" 
            p="xl" 
            shadow="xl"
            {...props}
            style={{
              border: '1px solid #e9ecef',
              background: 'white'
            }}
          >
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {type === 'register' && (
                  <>
                    <Group grow>
                      <TextInput
                        label="First Name"
                        placeholder="John"
                        size="md"
                        radius="md"
                        {...form.getInputProps('first_name')}
                        styles={{
                          input: {
                            borderColor: '#e9ecef',
                            '&:focus': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      />
                      <TextInput
                        label="Last Name"
                        placeholder="Doe"
                        size="md"
                        radius="md"
                        {...form.getInputProps('last_name')}
                        styles={{
                          input: {
                            borderColor: '#e9ecef',
                            '&:focus': {
                              borderColor: '#667eea'
                            }
                          }
                        }}
                      />
                    </Group>
                  </>
                )}
      
                <TextInput
                  required
                  label="Email"
                  placeholder="hello@example.com"
                  size="md"
                  radius="md"
                  {...form.getInputProps('email')}
                  styles={{
                    input: {
                      borderColor: '#e9ecef',
                      '&:focus': {
                        borderColor: '#667eea'
                      }
                    }
                  }}
                />

                {type === 'register' && (
                  <Select
                    label="Skill Level"
                    placeholder="Select your skill level"
                    size="md"
                    radius="md"
                    data={[
                      {value: 'beginner', label: '🌱 Beginner'}, 
                      {value: 'intermediate', label: '🚀 Intermediate'}, 
                      {value: 'advanced', label: '⚡ Advanced'}
                    ]}
                    {...form.getInputProps('skill_level')}
                    styles={{
                      input: {
                        borderColor: '#e9ecef',
                        '&:focus': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />
                )}

                <PasswordInput
                  required
                  label="Password"
                  placeholder="••••••••"
                  size="md"
                  radius="md"
                  {...form.getInputProps('password')}
                  styles={{
                    input: {
                      borderColor: '#e9ecef',
                      '&:focus': {
                        borderColor: '#667eea'
                      }
                    }
                  }}
                />
      
                <Button 
                  type="submit" 
                  size="lg"
                  radius="md"
                  fullWidth
                  mt="md"
                  leftSection={type === 'register' ? <FaUserPlus size={18} /> : <FaSignInAlt size={18} />}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    transition: 'transform 0.2s',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
                      }
                    }
                  }}
                >
                  {upperFirst(type)}
                </Button>
              </Stack>
            </form>

            <Divider my="xl" label="OR" labelPosition="center" />

            <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text={type === 'register' ? 'signup_with' : 'signin_with'}
                width="100%"
              />
            </Box>

            <Text ta="center" size="sm">
              {type === 'register' ? (
                <>
                  Already have an account?{' '}
                  <Anchor 
                    component="button" 
                    type="button" 
                    onClick={() => toggle()}
                    fw={600}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Sign in
                  </Anchor>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <Anchor 
                    component="button" 
                    type="button" 
                    onClick={() => toggle()}
                    fw={600}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Sign up
                  </Anchor>
                </>
              )}
            </Text>
          </Paper>

          <Text ta="center" size="xs" c="dimmed" mt="xl">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Box>
      </Container>
    );
  }