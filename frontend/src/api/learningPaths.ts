import apiClient from './apiClient';
import type { 
    CreateMessageNoteRequest, 
    MessageNoteResponse, 
    UpdateMessageNoteRequest 
} from '../types/learning_paths/api_types';


export const generateLearningPath = async (query: string) => {
  const response = await apiClient.post(
    `/learning-paths/generate-learning-path`,
    null, 
    { params: { query } }
  );
  return response.data;
};

export const userLearningPaths = async (topicId?: string) => {
  const response = await apiClient.get('/learning-paths/user-learning-paths', {
    params: topicId ? { topic_id: topicId } : {},
  });
  return response.data;
};

export const enrollInLearningPath = async (topicId: string) => {
  const response = await apiClient.post(`/learning-paths/enroll`, null, {
    params: { topic_id: topicId },
  });
  return response.data;
};

export const allTopics = async () => {
    const response = await apiClient.get('/learning-paths/topics');
    return response.data;
};

export const topicDetails = async (topicId: string) => {
    const response = await apiClient.get(`/learning-paths/topics/${topicId}`);
    return response.data;
};

export const getSubtopicMessages = async (topicId: string, subtopicId: string) => {
    const response = await apiClient.get(`/learning-paths/${topicId}/subtopics/${subtopicId}/messages`);
    return response.data;
};

export const skipSubtopic = async (topicId: string, subtopicId: string) => {
    const response = await apiClient.post(`/learning-paths/${topicId}/subtopics/${subtopicId}/skip`);
    return response.data;
};

/**
 * Get all notes for a specific message
 */
export const getMessageNotes = async (messageId: string): Promise<MessageNoteResponse[]> => {
    const response = await apiClient.get(`/learning-paths/messages/${messageId}/notes`);
    return response.data;
};

/**
 * Create a new note for a message text selection
 */
export const createMessageNote = async (data: CreateMessageNoteRequest): Promise<MessageNoteResponse> => {
    const response = await apiClient.post('/learning-paths/notes/create', data);
    return response.data;
};

/**
 * Update an existing note
 */
export const updateMessageNote = async (noteId: string, data: UpdateMessageNoteRequest): Promise<MessageNoteResponse> => {
    const response = await apiClient.post(`/learning-paths/notes/${noteId}/edit`, data);
    return response.data;
};

/**
 * Delete a note
 */
export const deleteMessageNote = async (noteId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/learning-paths/notes/${noteId}`);
    return response.data;
};