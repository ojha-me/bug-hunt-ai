import type { ConversationResponse } from "../types/ai_core/api_types";
import apiClient from "./apiClient"


export const getConversations = async (): Promise<ConversationResponse[]> => {
    const response = await apiClient.get('/conversation/get-conversations');
    return response.data;
};

export const getConversation = async (conversationId: string): Promise<ConversationResponse> => {
    const response = await apiClient.get(`/conversation/${conversationId}/`);
    return response.data;
};


export const createConversation = async (): Promise<ConversationResponse> => {
    const response = await apiClient.post('/conversation/create-conversation');
    return response.data;
};