import apiClient from "./apiClient";
import type { RevisionItem, ReviewResponse } from "../types/revision/api_types";

export const getDueRevisionItems = async (): Promise<RevisionItem[]> => {
  const response = await apiClient.get<RevisionItem[]>("/revision/due");
  return response.data;
};

export const getAllRevisionItems = async (): Promise<RevisionItem[]> => {
  const response = await apiClient.get<RevisionItem[]>("/revision/items");
  return response.data;
};

export const reviewRevisionItem = async (itemId: number, quality: number): Promise<ReviewResponse> => {
  const response = await apiClient.post<ReviewResponse>(`/revision/items/${itemId}/review`, {
    quality,
  });
  return response.data;
};