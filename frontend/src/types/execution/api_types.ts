/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface RunParams {
  code: string;
  language: string;
}
export interface RunResponse {
  output: string;
  error?: string | null;
}
export interface Schema {}
