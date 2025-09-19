import type { CreateUserSchema, CreateUserResponse } from "../types/users/api_types";
import apiClient from "./apiClient";


export const createUser = async (newUser: CreateUserSchema): Promise<CreateUserResponse> => {
    const response = await apiClient.post('api/users/create-user', newUser);
    return response.data;
  };