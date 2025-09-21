import { Button, Stack, ScrollArea, Box, Text, Loader } from "@mantine/core";
import { FaPlus } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { getConversations, createConversation } from "../api/conversation";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { notifications } from "@mantine/notifications";

export const Sidebar = () => {
  const navigate = useNavigate();
  
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

  const handleConversationClick = (conversationId: string) => {
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
                >
                  <Text lineClamp={1}>{conv.title}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </Text>
                </Box>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Box>
    </Box>
  );
};