import type { CreateUserSchema, CreateUserResponse, LoginParams, TokenResponse, UserProfileResponse } from "../types/users/api_types";
import apiClient from "./apiClient";


export const createUser = async (newUser: CreateUserSchema): Promise<CreateUserResponse> => {
    const response = await apiClient.post('users/create-user', newUser);
    return response.data;
  };

export const loginUser = async (user: LoginParams): Promise<TokenResponse> => {
    const response = await apiClient.post('users/login', user);
    return response.data;
}

export const getUserProfile = async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get('users/profile');
    return response.data;
}

export const googleAuth = async (credential: string): Promise<TokenResponse> => {
    const response = await apiClient.post('users/google-auth', { credential });
    return response.data;
}