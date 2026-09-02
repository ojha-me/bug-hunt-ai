import apiClient from "./apiClient";
import type {
  SDCourseResponse,
  SDCourseDetailResponse,
  UserSDCourseResponse,
  SDLearningMessage,
  SDCaseStudySummary,
  SDCaseStudyDetail,
} from "../types/system_design/api_types";

export const getSDCourses = async (): Promise<SDCourseResponse[]> => {
  const response = await apiClient.get("/system-design/courses");
  return response.data;
};

export const getSDCourseDetail = async (courseId: string): Promise<SDCourseDetailResponse> => {
  const response = await apiClient.get(`/system-design/courses/${courseId}`);
  return response.data;
};

export const getUserSDCourses = async (): Promise<UserSDCourseResponse[]> => {
  const response = await apiClient.get("/system-design/user-courses");
  return response.data;
};

export const enrollInSDCourse = async (courseId: string): Promise<UserSDCourseResponse> => {
  const response = await apiClient.post("/system-design/enroll", null, {
    params: { course_id: courseId },
  });
  return response.data;
};

export const getSDLessonMessages = async (
  courseId: string,
  lessonId: string
): Promise<SDLearningMessage[]> => {
  const response = await apiClient.get(
    `/system-design/user-courses/${courseId}/lessons/${lessonId}/messages`
  );
  return response.data;
};

export const getSDCaseStudies = async (): Promise<SDCaseStudySummary[]> => {
  const response = await apiClient.get("/system-design/case-studies");
  return response.data;
};

export const getSDCaseStudy = async (caseId: string): Promise<SDCaseStudyDetail> => {
  const response = await apiClient.get(`/system-design/case-studies/${caseId}`);
  return response.data;
};