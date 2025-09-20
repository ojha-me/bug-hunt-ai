import type { CreateUserSchema, CreateUserResponse, LoginParams, TokenPair } from "../types/users/api_types";
import apiClient from "./apiClient";


export const createUser = async (newUser: CreateUserSchema): Promise<CreateUserResponse> => {
    const response = await apiClient.post('users/create-user', newUser);
    return response.data;
  };

export const loginUser = async (user: LoginParams): Promise<TokenPair> => {
    const response = await apiClient.post('users/login', user);
    return response.data;
}

    