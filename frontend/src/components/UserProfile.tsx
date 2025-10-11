import { Container, Paper, Title, Text, Stack, Group, Badge, Divider, Box, Avatar, Button, Loader, Center } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { FaUser, FaChartLine, FaComments, FaGraduationCap, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '../api/apiClient';
import { notifications } from '@mantine/notifications';
import { getUserProfile } from '../api/user';

export const UserProfile = () => {
  const navigate = useNavigate();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
  });

  const handleLogout = () => {
    setAccessToken('');
    notifications.show({
      title: 'Logged out',
      message: 'You have been successfully logged out.',
      color: 'blue',
    });
    navigate('/login');
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'green';
      case 'intermediate': return 'blue';
      case 'advanced': return 'purple';
      default: return 'gray';
    }
  };

  const getSkillLevelEmoji = (level: string) => {
    switch (level) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🚀';
      case 'advanced': return '⚡';
      default: return '📚';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!profile) return null;

  return (
    <Container size="md" py="xl">
      <Paper p="xl" radius="lg" shadow="sm" withBorder>
        {/* Header Section */}
        <Group justify="space-between" mb="xl">
          <Group>
            <Avatar
              size="xl"
              radius="xl"
              color="violet"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <FaUser size={32} />
            </Avatar>
            <Box>
              <Title order={2}>
                {profile.first_name} {profile.last_name}
              </Title>
              <Text size="sm" c="dimmed">
                {profile.email}
              </Text>
              <Badge
                size="lg"
                mt="xs"
                color={getSkillLevelColor(profile.skill_level)}
                variant="light"
                leftSection={<span>{getSkillLevelEmoji(profile.skill_level)}</span>}
              >
                {profile.skill_level.charAt(0).toUpperCase() + profile.skill_level.slice(1)}
              </Badge>
            </Box>
          </Group>
          <Button
            color="red"
            variant="light"
            leftSection={<FaSignOutAlt />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Group>

        <Divider my="xl" />

        {/* Stats Section */}
        <Box>
          <Group mb="md">
            <FaChartLine size={20} />
            <Title order={3}>Usage Statistics</Title>
          </Group>

          <Stack gap="md">
            {/* Conversations Stats */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <Group>
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaComments color="white" size={20} />
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Total Conversations
                    </Text>
                    <Text size="xl" fw={700}>
                      {profile.stats.total_conversations}
                    </Text>
                  </Box>
                </Group>
                <Box ta="right">
                  <Text size="sm" c="dimmed">
                    Messages Sent
                  </Text>
                  <Text size="lg" fw={600}>
                    {profile.stats.total_messages}
                  </Text>
                </Box>
              </Group>
            </Paper>

            {/* Learning Paths Stats */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <Group>
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaGraduationCap color="white" size={20} />
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Learning Paths Enrolled
                    </Text>
                    <Text size="xl" fw={700}>
                      {profile.stats.learning_paths_enrolled}
                    </Text>
                  </Box>
                </Group>
                <Box ta="right">
                  <Text size="sm" c="dimmed">
                    Completed
                  </Text>
                  <Text size="lg" fw={600} c="green">
                    {profile.stats.learning_paths_completed}
                  </Text>
                </Box>
              </Group>
            </Paper>

            {/* Code Execution Stats */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between">
                <Group>
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text fw={700} c="white">
                      {'</>'}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed">
                      Code Executions
                    </Text>
                    <Text size="xl" fw={700}>
                      {profile.stats.code_executions}
                    </Text>
                  </Box>
                </Group>
                <Box ta="right">
                  <Text size="sm" c="dimmed">
                    Time Spent
                  </Text>
                  <Text size="lg" fw={600}>
                    {formatTime(profile.stats.total_time_spent_seconds)}
                  </Text>
                </Box>
              </Group>
            </Paper>
          </Stack>
        </Box>

        <Divider my="xl" />

        {/* Account Info */}
        <Box>
          <Title order={4} mb="md">
            Account Information
          </Title>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Member Since
              </Text>
              <Text size="sm" fw={500}>
                {new Date(profile.date_joined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Account Status
              </Text>
              <Badge color="green" variant="light">
                Active
              </Badge>
            </Group>
            {profile.stats.current_streak_days > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  🔥 Current Streak
                </Text>
                <Text size="sm" fw={600} c="orange">
                  {profile.stats.current_streak_days} {profile.stats.current_streak_days === 1 ? 'day' : 'days'}
                </Text>
              </Group>
            )}
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};
