/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface TestCaseInput {
  name?: string | null;
  stdin: string;
  expected_output: string;
}
export interface RunParams {
  code: string;
  language: string;
  test_cases?: TestCaseInput[] | null;
  conversation_id?: string | null;
}
export interface TestCaseResult {
  name: string;
  stdin: string;
  expected_output: string;
  actual_output: string;
  verdict: "passed" | "failed" | "error" | "timeout";
  execution_time_ms?: number | null;
  error?: string | null;
}
export interface RunResponse {
  output: string;
  error?: string | null;
  success?: boolean;
  execution_time_ms?: number | null;
  test_results?: TestCaseResult[] | null;
  summary?: { passed: number; total: number; all_passed: boolean } | null;
}
export interface Schema {}
