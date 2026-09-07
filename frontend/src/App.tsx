import { Routes, Route, Navigate } from "react-router-dom";
import { ChatContainer } from "./components/ChatContainer";
import { Layout } from "./components/Layout";
import { AuthenticationForm } from "./components/AuthenticationForm";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TopicSelection } from "./components/TopicSelection";
import {PathDetails} from "./components/PathDetails";
import LearningPathChatInterface from "./components/LearningPathChatInterface";
import { UserProfile } from "./components/UserProfile";
import { SystemDesignRoom } from "./components/SystemDesignRoom";
import { SDLearningRoom } from "./components/SDLearningRoom";
import { SDCoursesPage } from "./components/SDCoursesPage";
import { SDCaseStudiesPage } from "./components/SDCaseStudiesPage";
import { SDCaseStudyDetailPage } from "./components/SDCaseStudyDetailPage";
import { SystemDesignPracticePage } from "./components/SystemDesignPracticePage";
import { SystemDesignPracticeRoom } from "./components/SystemDesignPracticeRoom";
import { SystemDesignComponentsPage } from "./components/SystemDesignComponentsPage";
import { ComponentLessonPage } from "./components/ComponentLessonPage";
import { ComponentTutorRoom } from "./components/ComponentTutorRoom";
import { NotesView } from "./pages/NotesView";
import { LearningPathNotesView } from "./pages/LearningPathNotesView";
import { ProblemsPage } from "./components/ProblemsPage";
import { ProblemSolverPage } from "./components/ProblemSolverPage";
import { MockInterviewPage } from "./components/MockInterviewPage";
import { BehavioralPrepPage } from "./components/BehavioralPrepPage";
import { PatternsPage } from "./components/PatternsPage";
import { PatternDetailPage } from "./components/PatternDetailPage";
import { PatternLearningRoom } from "./components/PatternLearningRoom";
import { FoundationsPage } from "./components/FoundationsPage";
import { FoundationDetailPage } from "./components/FoundationDetailPage";
import { DashboardPage } from "./components/DashboardPage";
import { RevisionPage } from "./components/RevisionPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthenticationForm />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<DashboardPage />}
          />
          <Route path="/topics" element={<TopicSelection />} />
          <Route path="/learning-path/:pathId" element={<PathDetails />} />
          <Route path="/conversation/:conversationId" element={<ChatContainer />} />
          <Route path="/system-design/:conversationId" element={<SystemDesignRoom />} />
          <Route path="/system-design/courses" element={<SDCoursesPage />} />
          <Route path="/system-design/learn/:courseId" element={<SDLearningRoom />} />
          <Route path="/system-design/components" element={<SystemDesignComponentsPage />} />
          <Route path="/system-design/components/:kind" element={<ComponentLessonPage />} />
          <Route path="/component-tutor/:conversationId" element={<ComponentTutorRoom />} />
          <Route path="/system-design/case-studies" element={<SDCaseStudiesPage />} />
          <Route path="/system-design/case-studies/:caseStudyId" element={<SDCaseStudyDetailPage />} />
          <Route path="/system-design/practice" element={<SystemDesignPracticePage />} />
          <Route path="/system-design/practice/:conversationId" element={<SystemDesignPracticeRoom />} />
          <Route path="/learning-path/chat-interface/:learningTopicId" element={<LearningPathChatInterface />} />
          <Route path="/challenges" element={<ProblemsPage />} />
          <Route path="/challenges/:problemId" element={<ProblemSolverPage />} />
          <Route path="/foundations" element={<FoundationsPage />} />
          <Route path="/foundations/:slug" element={<FoundationDetailPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/patterns/:slug" element={<PatternDetailPage />} />
          <Route path="/patterns/learn/:conversationId" element={<PatternLearningRoom />} />
          <Route path="/mock" element={<MockInterviewPage />} />
          <Route path="/behavioral" element={<BehavioralPrepPage />} />
          <Route path="/revision" element={<RevisionPage />} />
          <Route path="/notes" element={<NotesView />} />
          <Route path="/learning-path/:pathId/notes" element={<LearningPathNotesView />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
