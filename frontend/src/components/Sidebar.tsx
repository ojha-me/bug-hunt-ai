import React from "react";

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt?: string;
}

interface UserProfile {
  name: string;
  email: string;
  skillLevel: string;
}

interface SidebarProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  user: UserProfile;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  onSelectConversation,
  onCreateConversation,
  user,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div
      className={`bg-white shadow-lg h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="p-2 border-b border-gray-200 hover:bg-gray-100"
      >
        {isCollapsed ? "→" : "←"}
      </button>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.skillLevel}</p>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {!isCollapsed &&
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-100 flex flex-col gap-1"
            >
              <span className="font-medium">{conv.title || "Untitled"}</span>
              {conv.lastMessage && (
                <span className="text-gray-400 text-sm truncate">{conv.lastMessage}</span>
              )}
            </button>
          ))}
      </div>

      {/* New Conversation Button */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onCreateConversation}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
          >
            + New Conversation
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
