import { Routes, Route, Navigate } from "react-router-dom";
import { ChatContainer } from "./components/ChatContainer";
import { Box } from "@mantine/core";
import { Layout } from "./components/Layout";
import { AuthenticationForm } from "./components/AuthenticationForm";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthenticationForm />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<Box p="md">Select a conversation or create a new one</Box>}
          />
          <Route path="/conversation/:conversationId" element={<ChatContainer />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
