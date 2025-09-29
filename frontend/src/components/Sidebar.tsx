import { Button, Stack, ScrollArea, Box, Text, Loader, Modal, Group, TextInput } from "@mantine/core";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getConversations, createConversation, updateConversationTitle, deleteConversation } from "../api/conversation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

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
      
      <Box mb="md">
        <Button 
          variant="filled"
          fullWidth 
          leftSection={<FaPlus />}
          onClick={() => createConvoMutation.mutate()}
        >
          New Conversation
        </Button>
      </Box>

      <Box style={{ flex: 1, overflow: 'hidden' }}>
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
              conversations.map((conv) => (
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