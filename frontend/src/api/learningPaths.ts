import apiClient from './apiClient';


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