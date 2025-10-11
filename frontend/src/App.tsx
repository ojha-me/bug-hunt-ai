import { Routes, Route, Navigate } from "react-router-dom";
import { ChatContainer } from "./components/ChatContainer";
import { Box } from "@mantine/core";
import { Layout } from "./components/Layout";
import { AuthenticationForm } from "./components/AuthenticationForm";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TopicSelection } from "./components/TopicSelection";
import {PathDetails} from "./components/PathDetails";
import LearningPathChatInterface from "./components/LearningPathChatInterface";
import { UserProfile } from "./components/UserProfile";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthenticationForm />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<Box p="md">Welcome to BugHunt AI! Start a new learning path or continue a conversation.</Box>}
          />
          <Route path="/topics" element={<TopicSelection />} />
          <Route path="/learning-path/:pathId" element={<PathDetails />} />
          <Route path="/conversation/:conversationId" element={<ChatContainer />} />
          <Route path="/learning-path/chat-interface/:learningTopicId" element={<LearningPathChatInterface />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
