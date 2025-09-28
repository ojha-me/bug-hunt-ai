import type { RunParams, RunResponse } from "../types/execution/api_types";
import apiClient from "./apiClient";

export const runCode = async (params: RunParams): Promise<RunResponse> => {
  try {
    const response = await apiClient.post("/execution/run", params);
    return response.data;
  } catch (error) {
    console.error("[Execution API] Error during code execution", error);
    throw error;
  }
};