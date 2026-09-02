import type { ConversationResponse, UpdateConversationTitleSchema } from "../types/ai_core/api_types";
import apiClient from "./apiClient"


export const getConversations = async (): Promise<ConversationResponse[]> => {
    const response = await apiClient.get('/conversation/get-conversations');
    return response.data;
};

export const getConversation = async (conversationId: string): Promise<ConversationResponse> => {
    const response = await apiClient.get(`/conversation/${conversationId}/`);
    return response.data;
};


export const createConversation = async (conversation_type?: ConversationResponse["conversation_type"]): Promise<ConversationResponse> => {
    const response = await apiClient.post('/conversation/create-conversation', { conversation_type: conversation_type || "general" });
    return response.data;
};

export const updateConversationTitle = async (data: UpdateConversationTitleSchema): Promise<ConversationResponse> => {
    const response = await apiClient.put(`/conversation/${data.conversation_id}/update-title`, data);
    return response.data;
};

export const deleteConversation = async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/conversation/${conversationId}/`);
};