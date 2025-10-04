// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   Container,
//   Title,
//   Text,
//   Card,
//   Badge,
//   Button,
//   Group,
//   Stack,
//   Progress,
//   Timeline,
//   Box,
//   Loader,
//   Center,
//   ActionIcon,
//   Tooltip,
//   Divider,
//   Grid
// } from '@mantine/core';
// import { 
//   FaPlay, 
//   FaCheck, 
//   FaForward, 
//   FaClock, 
//   FaTrophy, 
//   FaArrowLeft,
//   FaChartLine,
//   FaBullseye
// } from 'react-icons/fa';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { notifications } from '@mantine/notifications';
// import {
//   getLearningPath,
//   updateProgress,
//   formatDuration,
//   getStatusColor,
//   type UserLearningPath,
//   type SubtopicProgress
// } from '../api/learningPaths';

// export const LearningPathDashboard = () => {
//   const { pathId } = useParams<{ pathId: string }>();
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();

//   const { data: learningPath, isLoading } = useQuery<UserLearningPath>({
//     queryKey: ['learning-path', pathId],
//     queryFn: () => getLearningPath(pathId!),
//     enabled: !!pathId
//   });

//   const updateProgressMutation = useMutation({
//     mutationFn: ({ subtopicId, status, notes }: { subtopicId: string; status: string; notes?: string }) =>
//       updateProgress(pathId!, { subtopic_id: subtopicId, status, notes }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['learning-path', pathId] });
//       queryClient.invalidateQueries({ queryKey: ['user-learning-paths'] });
//     },
//     onError: (error: any) => {
//       notifications.show({
//         title: 'Error',
//         message: error.response?.data?.error || 'Failed to update progress',
//         color: 'red'
//       });
//     }
//   });

//   const handleStartSubtopic = (subtopicId: string) => {
//     updateProgressMutation.mutate({ subtopicId, status: 'learning' });
//     // Navigate to conversation
//     navigate(`/conversation/${learningPath?.conversation_id}`);
//   };

//   const handleCompleteSubtopic = (subtopicId: string) => {
//     updateProgressMutation.mutate({ subtopicId, status: 'completed' });
//   };

//   const handleSkipSubtopic = (subtopicId: string) => {
//     updateProgressMutation.mutate({ subtopicId, status: 'skipped' });
//   };

//   const handleContinueConversation = () => {
//     navigate(`/conversation/${learningPath?.conversation_id}`);
//   };

//   const getTimelineColor = (progress: SubtopicProgress) => {
//     switch (progress.status) {
//       case 'completed':
//         return 'green';
//       case 'learning':
//       case 'challenging':
//         return 'blue';
//       case 'skipped':
//         return 'yellow';
//       default:
//         return 'gray';
//     }
//   };

//   const getTimelineIcon = (progress: SubtopicProgress) => {
//     switch (progress.status) {
//       case 'completed':
//         return <FaCheck size={12} />;
//       case 'learning':
//       case 'challenging':
//         return <FaPlay size={12} />;
//       case 'skipped':
//         return <FaForward size={12} />;
//       default:
//         return null;
//     }
//   };

//   if (isLoading) {
//     return (
//       <Center h="50vh">
//         <Stack align="center">
//           <Loader size="lg" />
//           <Text>Loading learning path...</Text>
//         </Stack>
//       </Center>
//     );
//   }

//   if (!learningPath) {
//     return (
//       <Container size="md" py="xl">
//         <Center>
//           <Stack align="center">
//             <Text size="lg">Learning path not found</Text>
//             <Button onClick={() => navigate('/topics')}>
//               Browse Topics
//             </Button>
//           </Stack>
//         </Center>
//       </Container>
//     );
//   }

//   const currentProgress = learningPath.current_subtopic 
//     ? learningPath.progress.find(p => p.subtopic.id === learningPath.current_subtopic?.id)
//     : null;

//   const completedCount = learningPath.progress.filter(p => p.status === 'completed').length;
//   const totalCount = learningPath.progress.length;

//   return (
//     <Container size="xl" py="md">
//       <Stack gap="xl">
//         {/* Header */}
//         <Group>
//           <ActionIcon
//             variant="subtle"
//             size="lg"
//             onClick={() => navigate('/topics')}
//           >
//             <FaArrowLeft size={16} />
//           </ActionIcon>
//           <Box style={{ flex: 1 }}>
//             <Title order={1}>{learningPath.topic.name}</Title>
//             <Text c="dimmed">{learningPath.topic.description}</Text>
//           </Box>
//         </Group>

//         <Grid>
//           {/* Progress Overview */}
//           <Grid.Col span={{ base: 12, md: 8 }}>
//             <Card shadow="sm" padding="lg" radius="md" withBorder>
//               <Stack gap="md">
//                 <Group justify="space-between">
//                   <Title order={3}>Learning Progress</Title>
//                   <Badge 
//                     color={learningPath.is_completed ? 'green' : 'blue'}
//                     variant="filled"
//                     size="lg"
//                   >
//                     {Math.round(learningPath.progress_percentage)}% Complete
//                   </Badge>
//                 </Group>

//                 <Progress 
//                   value={learningPath.progress_percentage} 
//                   color={learningPath.is_completed ? 'green' : 'blue'}
//                   size="lg"
//                   radius="md"
//                 />

//                 <Group justify="space-between">
//                   <Group gap="xs">
//                     <FaBullseye size={16} color="gray" />
//                     <Text size="sm" c="dimmed">
//                       {completedCount} of {totalCount} lessons completed
//                     </Text>
//                   </Group>
//                   <Group gap="xs">
//                     <FaClock size={16} color="gray" />
//                     <Text size="sm" c="dimmed">
//                       {formatDuration(learningPath.topic.estimated_duration)} total
//                     </Text>
//                   </Group>
//                 </Group>

//                 {/* Current Subtopic */}
//                 {learningPath.current_subtopic && !learningPath.is_completed && (
//                   <Box>
//                     <Divider mb="md" />
//                     <Group justify="space-between" align="flex-start">
//                       <Box style={{ flex: 1 }}>
//                         <Text fw={500} mb={4}>Currently Learning:</Text>
//                         <Text size="lg" fw={600}>
//                           {learningPath.current_subtopic.name}
//                         </Text>
//                         <Text size="sm" c="dimmed" mt={4}>
//                           {learningPath.current_subtopic.description}
//                         </Text>
//                       </Box>
//                       <Button
//                         leftSection={<FaPlay size={16} />}
//                         onClick={handleContinueConversation}
//                       >
//                         Continue Learning
//                       </Button>
//                     </Group>
//                   </Box>
//                 )}

//                 {learningPath.is_completed && (
//                   <Box ta="center" py="md">
//                     <FaTrophy size={48} color="gold" />
//                     <Title order={3} mt="md" c="green">
//                       Congratulations! 🎉
//                     </Title>
//                     <Text c="dimmed">
//                       You've completed this learning path!
//                     </Text>
//                   </Box>
//                 )}
//               </Stack>
//             </Card>
//           </Grid.Col>

//           {/* Stats */}
//           <Grid.Col span={{ base: 12, md: 4 }}>
//             <Stack gap="md">
//               <Card shadow="sm" padding="md" radius="md" withBorder>
//                 <Group>
//                   <FaChartLine size={24} color="blue" />
//                   <Box>
//                     <Text size="lg" fw={600}>
//                       {Math.round(learningPath.progress_percentage)}%
//                     </Text>
//                     <Text size="xs" c="dimmed">Overall Progress</Text>
//                   </Box>
//                 </Group>
//               </Card>

//               <Card shadow="sm" padding="md" radius="md" withBorder>
//                 <Group>
//                   <FaCheck size={24} color="green" />
//                   <Box>
//                     <Text size="lg" fw={600}>
//                       {completedCount}/{totalCount}
//                     </Text>
//                     <Text size="xs" c="dimmed">Lessons Completed</Text>
//                   </Box>
//                 </Group>
//               </Card>

//               <Card shadow="sm" padding="md" radius="md" withBorder>
//                 <Group>
//                   <FaClock size={24} color="orange" />
//                   <Box>
//                     <Text size="lg" fw={600}>
//                       {formatDuration(learningPath.topic.estimated_duration)}
//                     </Text>
//                     <Text size="xs" c="dimmed">Estimated Duration</Text>
//                   </Box>
//                 </Group>
//               </Card>
//             </Stack>
//           </Grid.Col>
//         </Grid>

//         {/* Subtopics Timeline */}
//         <Card shadow="sm" padding="lg" radius="md" withBorder>
//           <Title order={3} mb="lg">Learning Path</Title>
          
//           <Timeline active={-1} bulletSize={24} lineWidth={2}>
//             {learningPath.progress
//               .sort((a, b) => a.subtopic.order - b.subtopic.order)
//               .map((progress, index) => (
//                 <Timeline.Item
//                   key={progress.subtopic.id}
//                   bullet={getTimelineIcon(progress)}
//                   title={progress.subtopic.name}
//                   color={getTimelineColor(progress)}
//                 >
//                   <Stack gap="sm">
//                     <Text size="sm" c="dimmed">
//                       {progress.subtopic.description}
//                     </Text>

//                     <Group gap="sm">
//                       <Badge 
//                         color={getStatusColor(progress.status)} 
//                         variant="light"
//                         size="sm"
//                       >
//                         {progress.status.replace('_', ' ')}
//                       </Badge>
//                       <Group gap={4}>
//                         <FaClock size={12} />
//                         <Text size="xs" c="dimmed">
//                           {formatDuration(progress.subtopic.estimated_duration)}
//                         </Text>
//                       </Group>
//                     </Group>

//                     {/* Learning Objectives */}
//                     {progress.subtopic.learning_objectives.length > 0 && (
//                       <Box>
//                         <Text size="xs" c="dimmed" mb={4}>Learning Objectives:</Text>
//                         <Stack gap={2}>
//                           {progress.subtopic.learning_objectives.map((objective, idx) => (
//                             <Text key={idx} size="xs" c="dimmed">
//                               • {objective}
//                             </Text>
//                           ))}
//                         </Stack>
//                       </Box>
//                     )}

//                     {/* Challenge Stats */}
//                     {progress.challenges_attempted > 0 && (
//                       <Group gap="sm">
//                         <Text size="xs" c="dimmed">
//                           Challenges: {progress.challenges_completed}/{progress.challenges_attempted}
//                         </Text>
//                         <Text size="xs" c="dimmed">
//                           Success Rate: {Math.round(progress.challenge_success_rate)}%
//                         </Text>
//                       </Group>
//                     )}

//                     {/* Action Buttons */}
//                     <Group gap="xs" mt="sm">
//                       {progress.status === 'not_started' && (
//                         <Button
//                           size="xs"
//                           leftSection={<FaPlay size={12} />}
//                           onClick={() => handleStartSubtopic(progress.subtopic.id)}
//                           loading={updateProgressMutation.isPending}
//                         >
//                           Start
//                         </Button>
//                       )}
                      
//                       {progress.status === 'learning' && (
//                         <>
//                           <Button
//                             size="xs"
//                             leftSection={<FaPlay size={12} />}
//                             onClick={handleContinueConversation}
//                           >
//                             Continue
//                           </Button>
//                           <Button
//                             size="xs"
//                             variant="outline"
//                             leftSection={<FaCheck size={12} />}
//                             onClick={() => handleCompleteSubtopic(progress.subtopic.id)}
//                             loading={updateProgressMutation.isPending}
//                           >
//                             Mark Complete
//                           </Button>
//                         </>
//                       )}

//                       {progress.status === 'challenging' && (
//                         <Button
//                           size="xs"
//                           leftSection={<FaPlay size={12} />}
//                           onClick={handleContinueConversation}
//                         >
//                           Continue Challenges
//                         </Button>
//                       )}

//                       {(progress.status === 'not_started' || progress.status === 'learning') && (
//                         <Tooltip label="Skip this lesson">
//                           <ActionIcon
//                             size="sm"
//                             variant="subtle"
//                             onClick={() => handleSkipSubtopic(progress.subtopic.id)}
//                             loading={updateProgressMutation.isPending}
//                           >
//                             <FaForward size={12} />
//                           </ActionIcon>
//                         </Tooltip>
//                       )}
//                     </Group>
//                   </Stack>
//                 </Timeline.Item>
//               ))}
//           </Timeline>
//         </Card>
//       </Stack>
//     </Container>
//   );
// };
