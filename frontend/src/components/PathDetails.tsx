import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Text,
  Button,
  Stack,
  Center,
  Loader,
  Paper,
  Group,
  Title,
  Badge,
  Divider,
  Accordion,
  List
} from '@mantine/core';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
    enrollInLearningPath,
    topicDetails,
    userLearningPaths,
} from '../api/learningPaths';
import type { LearningTopicDetailResponse, UserLearningPathResponse } from '../types/learning_paths/api_types';
import { FaPlay } from 'react-icons/fa';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

export const PathDetails = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: learningPathDetail, isLoading } = useQuery<LearningTopicDetailResponse>({
    queryKey: ['learning-path', pathId],
    queryFn: () => topicDetails(pathId!),
    enabled: !!pathId
  });

  const { data: userLearningPath } = useQuery<UserLearningPathResponse[]>({
    queryKey: ['user-learning-path', pathId],
    queryFn: () => userLearningPaths(pathId!),
    enabled: !!pathId
  });
  
  const currentSubtopic = userLearningPath?.length ? userLearningPath?.[0].current_subtopic?.id : null;

  const enrollMutation = useMutation({
    mutationFn: enrollInLearningPath,
    onSuccess: () => {
      notifications.show({
        title: 'Success!',
        message: 'New Conversation created',
        color: 'green',
      });
      queryClient.invalidateQueries({
        queryKey: ['user-learning-path', pathId],
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    },
  });


const handleEnroll = () => {
    if (!pathId) return;
    enrollMutation.mutate(pathId);
}

const handleSkipSubtopic = () => {
   console.log("implement skip here")
}

  if (isLoading) {
    return (
      <Center h="50vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text>Loading learning path...</Text>
        </Stack>
      </Center>
    );
  }

  if (!learningPathDetail) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Stack align="center">
            <Text size="lg">Learning path not found</Text>
            <Button onClick={() => navigate('/topics')}>
              Browse Topics
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }
  return (
    <Container size="md" py="xl">
      <Paper p="xl" radius="lg" shadow="sm" withBorder>
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>{learningPathDetail.name}</Title>
            <Text mt="sm" c="dimmed">
              {learningPathDetail.description}
            </Text>
          </div>
          <div>
            <Badge color="blue" size="lg">
              {learningPathDetail.difficulty_level}
            </Badge>
          </div>
        </Group>

        <Group mt="md" gap="xl">
          <Badge color="teal" variant="light">
            Duration: {learningPathDetail.estimated_duration.replace("P0DT", "").replace("H00M00S", "h")}
          </Badge>
          <Badge color={learningPathDetail.is_active ? "green" : "gray"} variant="light">
            {learningPathDetail.is_active ? "Active" : "Inactive"}
          </Badge>
        </Group>
        {
            userLearningPath?.length === 0 && (
                <Button
                mt="md"
                leftSection={<FaPlay size={16} />}
                onClick={()=>handleEnroll()}
                >
                Enroll
            </Button>
            )
        }
      </Paper>

      <Divider my="xl" />

      <Title order={3} mb="md">
        Subtopics
      </Title>

      <Accordion variant="separated">
        {learningPathDetail?.subtopics?.map((subtopic) => (
          <Accordion.Item key={subtopic.id} value={subtopic.id}>
            <Accordion.Control>
              <Group justify="space-between" w="100%">
                <Text fw={500}>{subtopic.order}. {subtopic.name}</Text>
                <Badge color="indigo" variant="light">
                  {subtopic.estimated_duration.replace("P0DT", "").replace("H00M00S", "h")}
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Text c="dimmed" mb="sm">{subtopic.description}</Text>
              <List spacing="xs" withPadding>
                {subtopic.learning_objectives.map((objective, idx) => (
                  <List.Item key={idx}>{objective}</List.Item>
                ))}
              </List>
              {
                currentSubtopic === subtopic.id && (
                  <Group>
                  <Button
                  mt="md"
                  leftSection={<FaPlay size={16} />}
                  onClick={()=>navigate(`/learning-path/chat-interface/${pathId}/${subtopic.id}`)}
                  >
                  Start Learning
                </Button>
                <Button
                mt="md"
                leftSection={<FaPlay size={16} />}
                onClick={()=>handleSkipSubtopic()}
                >
                Skip Subtopic
              </Button>
              </Group>
                )
              }
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Container>
  );
};
