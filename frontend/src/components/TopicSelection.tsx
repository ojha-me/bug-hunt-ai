import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Badge,
  Button,
  Group,
  Stack,
  Center,
  TextInput,
  Select,
  Box,
  Progress,
  Divider,
  Loader,
  Modal,
  Textarea
} from '@mantine/core';
import { FaSearch, FaClock, FaGraduationCap, FaPlay, FaCheck, FaPlus } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  userLearningPaths,
  allTopics,
  generateLearningPath
} from '../api/learningPaths';
import type { LearningTopicResponse, UserLearningPathResponse } from '../types/learning_paths/api_types';

export const TopicSelection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [learningTopic, setLearningTopic] = useState('');

  const { data: topics, isLoading: topicsLoading } = useQuery<LearningTopicResponse[]>({
    queryKey: ['learning-topics'],
    queryFn: allTopics
  });

  const { data: userPaths } = useQuery<UserLearningPathResponse[]>({
    queryKey: ['user-learning-paths'],
    queryFn: ()=> userLearningPaths()
  });

  const generateLearningPathMutation = useMutation({
    mutationFn: generateLearningPath,
    onSuccess: () => {
      notifications.show({
        title: 'Success!',
        message: 'Learning path generated',
        color: 'green',
      });
      // Refresh the topics list to include the newly generated topic
      queryClient.invalidateQueries({ queryKey: ['learning-topics'] });
      queryClient.invalidateQueries({ queryKey: ['user-learning-paths'] });
      setIsLearningModalOpen(false);
      setLearningTopic('');
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    },
  });

  const filteredTopics = topics?.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !difficultyFilter || topic.difficulty_level === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  }) || [];

  const getUserPathForTopic = (topicId: string) => {
    return userPaths?.find(path => path.topic.id === topicId && path.is_active);
  };

  const handleContinueLearning = (learningTopic: LearningTopicResponse) => {
    navigate(`/learning-path/${learningTopic.id}`);
  };

  if (topicsLoading) {
    return (
      <Center h="50vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>Loading learning topics...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Box ta="center">
          <Title order={1} mb="md">
            Choose Your Learning Path
          </Title>
          <Text size="lg" c="dimmed" maw={600} mx="auto">
            Select a topic to start your structured learning journey. Each path includes 
            interactive lessons, hands-on coding practice, and bug-fixing challenges.
          </Text>
          <Button 
            variant="filled"
            mt="md"
            leftSection={<FaPlus />}
            onClick={() => setIsLearningModalOpen(true)}
          >
            Create New Learning Path
          </Button>
        </Box>

        {/* Filters */}
        <Group justify="center" gap="md">
          <TextInput
            placeholder="Search topics..."
            leftSection={<FaSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: 300 }}
          />
          <Select
            placeholder="Filter by difficulty"
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            data={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' }
            ]}
            clearable
          />
        </Group>

        {/* Topics Grid */}
        <Grid>
          {filteredTopics.map((topic) => {
            const userPath = getUserPathForTopic(topic.id);
            const isStarted = !!userPath;
            const isCompleted = userPath?.is_completed || false;
            
            return (
              <Grid.Col key={topic.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Card 
                  shadow="sm" 
                  padding="lg" 
                  radius="md" 
                  withBorder 
                  h="100%"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  {/* Progress indicator for started topics */}
                  {isStarted && (
                    <Box mb="sm">
                      <Group justify="space-between" mb={4}>
                        <Text size="xs" c="dimmed">Progress</Text>
                        <Text size="xs" c="dimmed">{Math.round(userPath.progress_percentage)}%</Text>
                      </Group>
                      <Progress 
                        value={userPath.progress_percentage} 
                        color={isCompleted ? 'green' : 'blue'}
                        size="sm"
                      />
                    </Box>
                  )}

                  <Stack gap="sm" style={{ flex: 1 }}>
                    {/* Header */}
                    <Group justify="space-between" align="flex-start">
                      <Badge 
                        // color={getDifficultyColor(topic.difficulty_level)} 
                        variant="light"
                        size="sm"
                      >
                        {topic.difficulty_level}
                      </Badge>
                      {isCompleted && (
                        <Badge color="green" variant="filled" size="sm">
                          <FaCheck size={10} style={{ marginRight: 4 }} />
                          Completed
                        </Badge>
                      )}
                    </Group>

                    {/* Content */}
                    <Title order={3} size="h4">
                      {topic.name}
                    </Title>
                    
                    <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                      {topic.description}
                    </Text>

                    {/* Stats */}
                    <Group gap="lg" mt="auto">
                      <Group gap={4}>
                        <FaClock size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {topic.estimated_duration}
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <FaGraduationCap size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {topic.subtopics_count} lessons
                        </Text>
                      </Group>
                    </Group>

                    { topic.prerequisites && topic.prerequisites?.length > 0 && (
                      <Box>
                        <Text size="xs" c="dimmed" mb={4}>Prerequisites:</Text>
                        <Group gap={4}>
                          {topic.prerequisites.map((prereq) => (
                            <Badge key={prereq.id} size="xs" variant="outline">
                              {prereq.name}
                            </Badge>
                          ))}
                        </Group>
                      </Box>
                    )}

                    <Divider />

                    {isStarted ? (
                      <Button
                        fullWidth
                        variant={isCompleted ? "outline" : "filled"}
                        color={isCompleted ? "green" : "blue"}
                        leftSection={isCompleted ? <FaCheck size={16} /> : <FaPlay size={16} />}
                        onClick={() => handleContinueLearning(topic)}
                      >
                        {isCompleted ? 'Review' : 'Continue Learning'}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        leftSection={<FaPlay size={16} />}
                        onClick={() => navigate(`/learning-path/${topic.id}`)}
                      >
                        Path Details
                      </Button>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>

        {filteredTopics.length === 0 && (
          <Center py="xl">
            <Stack align="center">
              <Text size="lg" c="dimmed">No topics found</Text>
              <Text size="sm" c="dimmed">
                Try adjusting your search or filter criteria
              </Text>
            </Stack>
          </Center>
        )}
      </Stack>
      {/* Create Learning Path Modal */}
      <Modal
        opened={isLearningModalOpen}
        onClose={() => {
          setIsLearningModalOpen(false);
          setLearningTopic("");
        }}
        title="What would you like to learn?"
        centered
      >
        <Text size="sm" mb="md">
          Tell us what you want to learn and our AI tutor will create a personalized learning path for you.
        </Text>
        <Textarea
          label="Learning Topic"
          placeholder="e.g., React hooks, Python data structures, JavaScript algorithms"
          value={learningTopic}
          onChange={(e) => setLearningTopic(e.currentTarget.value)}
          mb="md"
          autosize
          minRows={2}
          maxRows={6}
        />
        <Group justify="flex-end">
          <Button 
            variant="default" 
            onClick={() => {
              setIsLearningModalOpen(false);
              setLearningTopic("");
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              generateLearningPathMutation.mutate(learningTopic);
            }}
            disabled={!learningTopic.trim()}
            loading={generateLearningPathMutation.isPending}
          >
            Create Learning Path
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};
