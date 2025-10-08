import { Button, Stack, ScrollArea, Box, Text, Loader, Modal, Group, TextInput, Divider, Progress, Badge } from "@mantine/core";
import { FaPlus, FaEdit, FaTrash, FaGraduationCap, FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getConversations, createConversation, updateConversationTitle, deleteConversation } from "../api/conversation";
import { userLearningPaths } from "../api/learningPaths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import type { UserLearningPathResponse } from "../types/learning_paths/api_types";

export const Sidebar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingConversation, setEditingConversation] = useState<ConversationResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  
  const { data: conversations, isLoading } = useQuery<ConversationResponse[]>({
    queryKey: ['conversations'],
    queryFn: getConversations
  });

  const { data: learningPaths, isLoading: pathsLoading } = useQuery<UserLearningPathResponse[]>({
    queryKey: ['learning-paths'],
    queryFn: () => userLearningPaths()
  });
  
  const createConvoMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      notifications.show({
        title: 'Success!',
        message: 'New Conversation created',
        color: 'green',
      });
      navigate(`/conversation/${newConversation.id}`);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    },
  });

  const updateConvoMutation = useMutation({
    mutationFn: updateConversationTitle,
    onSuccess: (updatedConversation) => {
      notifications.show({
        title: 'Success!',
        message: 'Conversation title updated',
        color: 'green',
      });
      queryClient.setQueryData<ConversationResponse[]>(['conversations'], (old) => 
        old?.map(conv => conv.id === updatedConversation.id ? updatedConversation : conv) || []
      );
      setEditingConversation(null);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    },
  });

  const deleteConvoMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      notifications.show({
        title: 'Success!',
        message: 'Conversation deleted',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setDeletingConversationId(null);
    },
    onError: (error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    },
  });

  const handleConversationClick = (conversationId: string) => {
    navigate(`/conversation/${conversationId}`);
  };
  
  const handleEditClick = (conversation: ConversationResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversation(conversation);
    setEditTitle(conversation.title);
  };
  
  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingConversationId(conversationId);
  };
  
  const handleEditSubmit = () => {
    if (editingConversation && editTitle.trim()) {
      updateConvoMutation.mutate({ conversation_id: editingConversation.id, title: editTitle });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (deletingConversationId) {
      deleteConvoMutation.mutate(deletingConversationId);
    }
  };

  const handleLearningPathClick = (pathId: string) => {
    navigate(`/learning-path/${pathId}`);
  };

  const handleContinueLearning = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/conversation/${conversationId}`);
  };
  
  return (
    <Box 
      style={{
        width: '300px',
        height: '100vh',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: 'white',
        zIndex: 100
      }}
    >
      <Text size="xl" fw={700} mb="md" style={{ textAlign: 'center' }}>BugHunt</Text>
      
      <Stack gap="sm" mb="md">
        
        <Button 
          variant="outline"
          fullWidth 
          leftSection={<FaPlus />}
          onClick={() => createConvoMutation.mutate()}
        >
          New Chat
        </Button>
        <Button 
          variant="filled"
          fullWidth 
          leftSection={<FaGraduationCap />}
          onClick={() => navigate('/topics')}
        >
          Learning Paths
        </Button>
      </Stack>

      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <Box mb="md">
          <Text size="sm" c="dimmed" mb="xs">Active Learning Paths</Text>
          <ScrollArea style={{ maxHeight: '200px' }}>
            <Stack gap={0}>
              {pathsLoading ? (
                <Box ta="center" pt="sm">
                  <Loader size="sm" />
                </Box>
              ) : !learningPaths?.length ? (
                <Text size="xs" c="dimmed" ta="center" py="sm">
                  No active learning paths
                </Text>
              ) : (
                learningPaths.map((path) => (
                  <Box 
                    key={path.id} 
                    p="sm" 
                    className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={() => handleLearningPathClick(path.id)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" lineClamp={1} fw={500}>
                          {path.topic.name}
                        </Text>
                        <Group gap="xs" mt={2}>
                          <Badge 
                            size="xs" 
                            color={path.is_completed ? 'green' : 'blue'}
                            variant="light"
                          >
                            {Math.round(path.progress_percentage)}%
                          </Badge>
                          {path.current_subtopic && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {path.current_subtopic.name}
                            </Text>
                          )}
                        </Group>
                      </Box>
                      {!path.is_completed && (
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={(e) => handleContinueLearning(path.conversation_id, e)}
                        >
                          <FaPlay size={10} />
                        </Button>
                      )}
                    </Group>
                    <Progress 
                      value={path.progress_percentage} 
                      size="xs" 
                      color={path.is_completed ? 'green' : 'blue'}
                    />
                  </Box>
                ))
              )}
            </Stack>
          </ScrollArea>
        </Box>

        <Divider mb="md" />

        {/* Regular Conversations Section */}
        <Box>
          <Text size="sm" c="dimmed" mb="xs">Recent Conversations</Text>
          <ScrollArea style={{ height: '100%' }}>
            <Stack gap={0}>
              {isLoading ? (
                <Box ta="center" pt="xl">
                  <Loader size="sm" />
                </Box>
              ) : !conversations?.length ? (
                <Text size="sm" c="dimmed" ta="center" mt="md">
                  No conversations yet
                </Text>
              ) : (
                conversations
                  .filter(conv => !learningPaths?.some(path => path.conversation_id === conv.id))
                  .map((conv) => (
                    <Box 
                      key={conv.id} 
                      p="sm" 
                      className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleConversationClick(conv.id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text lineClamp={1}>{conv.title}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </Text>
                      </Box>
                      <Group gap="xs" style={{ flexShrink: 0 }}>
                        <FaEdit 
                          size={14}
                          className="cursor-pointer text-gray-500 hover:text-blue-500"
                          onClick={(e) => handleEditClick(conv, e)}
                        />
                        <FaTrash 
                          size={14}
                          className="cursor-pointer text-gray-500 hover:text-red-500"
                          onClick={(e) => handleDeleteClick(conv.id, e)}
                        />
                      </Group>
                    </Box>
                  ))
              )}
            </Stack>
          </ScrollArea>
        </Box>
      </Box>
      
      {/* Edit Conversation Modal */}
      <Modal
        opened={!!editingConversation}
        onClose={() => setEditingConversation(null)}
        title="Edit Conversation Title"
        centered
      >
        <TextInput
          label="Title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Enter conversation title"
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setEditingConversation(null)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit}
            disabled={!editTitle.trim()}
          >
            Save
          </Button>
        </Group>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        opened={!!deletingConversationId}
        onClose={() => setDeletingConversationId(null)}
        title="Delete Conversation"
        centered
      >
        <Text size="sm" mb="md">
          Are you sure you want to delete this conversation? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeletingConversationId(null)}>
            Cancel
          </Button>
          <Button 
            color="red"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};