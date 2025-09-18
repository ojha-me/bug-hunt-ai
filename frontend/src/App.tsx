import { useState } from "react";
import ChatContainer from "./components/ChatContainer";
import Sidebar, { type Conversation } from "./components/Sidebar";

const dummyConversations: Conversation[] = [
  {
    id: "1",
    title: "JavaScript Basics",
    lastMessage: "Try fixing the off-by-one error in the loop.",
    updatedAt: "2025-09-18T10:30:00Z",
  },
  {
    id: "2",
    title: "Python Loops",
    lastMessage: "Remember to increment the counter.",
    updatedAt: "2025-09-17T18:45:00Z",
  },
  {
    id: "3",
    title: "React State",
    lastMessage: "Did you understand why useEffect runs twice?",
    updatedAt: "2025-09-16T14:20:00Z",
  },
  {
    id: "4",
    title: "Django Models",
    lastMessage: "Check your ForeignKey relationship.",
    updatedAt: "2025-09-15T09:50:00Z",
  },
];

 const dummyUser = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  skillLevel: "Intermediate",
};
function App() {
  const [selectedConversationId, setSelectedConversationId] = useState(
    dummyConversations[0].id
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);
  
  return (
    <div className="flex h-screen">
    <Sidebar
      user={dummyUser}
      conversations={dummyConversations}
      onSelectConversation={setSelectedConversationId}
      onCreateConversation={() => console.log("Create new conversation")}
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={handleToggleSidebar}
    />

    <div
      className={`flex-1 transition-all duration-300 ${
        isSidebarCollapsed ? "ml-16" : "ml-0"
      }`}
    >
      <ChatContainer selectedConversationId={selectedConversationId} />
    </div>
  </div>
  );
}

export default App;
