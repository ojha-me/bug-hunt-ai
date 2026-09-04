import {
  Button,
  Stack,
  ScrollArea,
  Box,
  Text,
  Loader,
  Modal,
  UnstyledButton,
  TextInput,
  Divider,
  Progress,
  ActionIcon,
  Tooltip,
  Group,
} from "@mantine/core";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaGraduationCap,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaProjectDiagram,
  FaCode,
  FaBook,
  FaRedoAlt,
  FaHome,
  FaDumbbell,
  FaCubes,
  FaStopwatch,
  FaComments,
} from "react-icons/fa";
import { RiStickyNoteLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";
import { getConversations, createConversation, updateConversationTitle, deleteConversation } from "../api/conversation";
import { userLearningPaths } from "../api/learningPaths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { notifications } from "@mantine/notifications";
import { useState, type ReactNode } from "react";
import type { UserLearningPathResponse } from "../types/learning_paths/api_types";
import { useSidebar } from "../contexts/SidebarContext";
import { brandGradient } from "../theme";

const WIDTH = 288;
const WIDTH_COLLAPSED = 64;

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active, collapsed, onClick }: NavItemProps) => {
  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow>
        <ActionIcon
          variant={active ? "filled" : "default"}
          color={active ? "indigo" : undefined}
          size="xl"
          radius="md"
          aria-label={label}
          onClick={onClick}
        >
          {icon}
        </ActionIcon>
      </Tooltip>
    );
  }
  return (
    <UnstyledButton
      className="nav-item"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0.5rem 0.7rem",
        borderRadius: "var(--mantine-radius-md)",
        width: "100%",
        background: active ? "var(--mantine-primary-color-light)" : "transparent",
        color: active ? "var(--mantine-primary-color-filled)" : "var(--mantine-color-text)",
        fontWeight: active ? 650 : 500,
      }}
    >
      {icon}
      <Text size="sm" lh={1}>
        {label}
      </Text>
    </UnstyledButton>
  );
};

const SectionLabel = ({ children, collapsed }: { children: ReactNode; collapsed: boolean }) =>
  collapsed ? null : (
    <Text size="xs" c="dimmed" mb="xs" className="side-label" fw={700}>
      {children}
    </Text>
  );

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [editingConversation, setEditingConversation] = useState<ConversationResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const path = location.pathname;

  const { data: conversations, isLoading: convosLoading } = useQuery<ConversationResponse[]>({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const { data: learningPaths, isLoading: pathsLoading } = useQuery<UserLearningPathResponse[]>({
    queryKey: ["learning-paths"],
    queryFn: () => userLearningPaths(),
  });

  const createConvoMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      notifications.show({
        title: "Success!",
        message: "New conversation created",
        color: "green",
      });
      navigate(`/conversation/${newConversation.id}`);
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message || "An unexpected error occurred. Please try again.",
        color: "red",
      });
    },
  });

  const updateConvoMutation = useMutation({
    mutationFn: updateConversationTitle,
    onSuccess: (updatedConversation) => {
      notifications.show({ title: "Success!", message: "Conversation title updated", color: "green" });
      queryClient.setQueryData<ConversationResponse[]>(["conversations"], (old) =>
        old?.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv)) || []
      );
      setEditingConversation(null);
    },
    onError: (error) => {
      notifications.show({ title: "Error", message: error.message || "Please try again.", color: "red" });
    },
  });

  const deleteConvoMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      notifications.show({ title: "Success!", message: "Conversation deleted", color: "green" });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setDeletingConversationId(null);
    },
    onError: (error) => {
      notifications.show({ title: "Error", message: error.message || "Please try again.", color: "red" });
    },
  });

  const handleConversationClick = (conversation: ConversationResponse) => {
    if (conversation.conversation_type === "system_design") {
      navigate(`/system-design/${conversation.id}`);
    } else if (conversation.conversation_type === "system_design_practice") {
      navigate(`/system-design/practice/${conversation.id}`);
    } else if (conversation.conversation_type === "component_tutor") {
      navigate(`/component-tutor/${conversation.id}`);
    } else {
      navigate(`/conversation/${conversation.id}`);
    }
  };

  const handleEditClick = (conversation: ConversationResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversation(conversation);
    setEditTitle(conversation.title);
  };

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingConversationId(conversationId);
  };

  const handleEditSubmit = () => {
    if (editingConversation && editTitle.trim()) {
      updateConvoMutation.mutate({ conversation_id: editingConversation.id, title: editTitle });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingConversationId) {
      deleteConvoMutation.mutate(deletingConversationId);
    }
  };

  const handleLearningPathClick = (topicId: string) => {
    navigate(`/learning-path/${topicId}`);
  };

  const handleContinueLearning = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/learning-path/chat-interface/${topicId}`);
  };

  const isSystemDesign =
    path.startsWith("/system-design") &&
    !path.startsWith("/system-design/case-studies") &&
    !path.startsWith("/system-design/practice") &&
    !path.startsWith("/system-design/components");
  const isCaseStudies = path.startsWith("/system-design/case-studies");
  const isPractice = path.startsWith("/system-design/practice");
  const isComponents = path.startsWith("/system-design/components");

  return (
    <Box
      style={{
        width: isCollapsed ? WIDTH_COLLAPSED : WIDTH,
        height: "100vh",
        borderRight: "1px solid var(--app-line)",
        display: "flex",
        flexDirection: "column",
        padding: isCollapsed ? "0.6rem" : "1rem",
        position: "fixed",
        left: 0,
        top: 0,
        backgroundColor: "var(--app-surface)",
        zIndex: 100,
        transition: "width 240ms var(--ease-out), padding 240ms var(--ease-out)",
      }}
    >
      <Group justify="space-between" mb="lg" wrap="nowrap">
        {!isCollapsed ? (
          <UnstyledButton
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Box
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                background: brandGradient,
                flexShrink: 0,
              }}
            />
            <Text fw={700} size="lg" style={{ letterSpacing: -0.01 }}>
              BugHunt
            </Text>
          </UnstyledButton>
        ) : (
          <Box
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              background: brandGradient,
              margin: "0 auto",
            }}
          />
        )}
        <Tooltip label={isCollapsed ? "Expand" : "Collapse"} position="right">
          <ActionIcon variant="subtle" onClick={() => setIsCollapsed(!isCollapsed)} size="lg" radius="md">
            {isCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      <Stack gap="xs" mb="md">
        <Button
          variant="filled"
          fullWidth
          leftSection={<FaPlus size={12} />}
          onClick={() => createConvoMutation.mutate()}
          radius="md"
        >
          {!isCollapsed && "New Chat"}
        </Button>

        <Box>
          <SectionLabel collapsed={isCollapsed}>Overview</SectionLabel>
          <Stack gap={2}>
            <NavItem
              icon={<FaHome size={16} />}
              label="Dashboard"
              active={path === "/"}
              collapsed={isCollapsed}
              onClick={() => navigate("/")}
            />
            <NavItem
              icon={<FaGraduationCap size={16} />}
              label="Learning Paths"
              active={path.startsWith("/topics") || path.startsWith("/learning-path")}
              collapsed={isCollapsed}
              onClick={() => navigate("/topics")}
            />
          </Stack>
        </Box>

        <Box mt="sm">
          <SectionLabel collapsed={isCollapsed}>Practice</SectionLabel>
          <Stack gap={2}>
            <NavItem
              icon={<FaCode size={16} />}
              label="Coding Problems"
              active={path.startsWith("/challenges")}
              collapsed={isCollapsed}
              onClick={() => navigate("/challenges")}
            />
            <NavItem
              icon={<FaStopwatch size={16} />}
              label="Mock Interview"
              active={path.startsWith("/mock")}
              collapsed={isCollapsed}
              onClick={() => navigate("/mock")}
            />
            <NavItem
              icon={<FaComments size={16} />}
              label="Behavioral Prep"
              active={path.startsWith("/behavioral")}
              collapsed={isCollapsed}
              onClick={() => navigate("/behavioral")}
            />
            <NavItem
              icon={<FaProjectDiagram size={16} />}
              label="System Design"
              active={isSystemDesign}
              collapsed={isCollapsed}
              onClick={() => navigate("/system-design/courses")}
            />
            <NavItem
              icon={<FaCubes size={16} />}
              label="Components"
              active={isComponents}
              collapsed={isCollapsed}
              onClick={() => navigate("/system-design/components")}
            />
            <NavItem
              icon={<FaBook size={16} />}
              label="Case Studies"
              active={isCaseStudies}
              collapsed={isCollapsed}
              onClick={() => navigate("/system-design/case-studies")}
            />
            <NavItem
              icon={<FaDumbbell size={16} />}
              label="Design Drills"
              active={isPractice}
              collapsed={isCollapsed}
              onClick={() => navigate("/system-design/practice")}
            />
          </Stack>
        </Box>

        <Box mt="sm">
          <SectionLabel collapsed={isCollapsed}>Review</SectionLabel>
          <Stack gap={2}>
            <NavItem
              icon={<FaRedoAlt size={16} />}
              label="Review Queue"
              active={path.startsWith("/revision")}
              collapsed={isCollapsed}
              onClick={() => navigate("/revision")}
            />
            <NavItem
              icon={<RiStickyNoteLine size={16} />}
              label="My Notes"
              active={path.startsWith("/notes")}
              collapsed={isCollapsed}
              onClick={() => navigate("/notes")}
            />
          </Stack>
        </Box>
      </Stack>

      {!isCollapsed ? (
        <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto">
          <Divider mb="md" />
          <Box mb="lg">
            <SectionLabel collapsed={false}>Active learning paths</SectionLabel>
            <Stack gap={2}>
              {pathsLoading ? (
                <Loader size="sm" mx="auto" my="sm" />
              ) : !learningPaths?.length ? (
                <Text size="xs" c="dimmed" ta="center" py="sm">
                  No active learning paths
                </Text>
              ) : (
                learningPaths.map((pathRow) => (
                  <Box
                    key={pathRow.id}
                    p="xs"
                    className="row-item"
                    onClick={() => handleLearningPathClick(pathRow.topic.id)}
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" lineClamp={1} fw={500}>
                          {pathRow.topic.name}
                        </Text>
                        <Group gap="xs" mt={2} wrap="nowrap">
                          <Text size="xs" c="dimmed" fw={600}>
                            {Math.round(pathRow.progress_percentage)}%
                          </Text>
                          <Progress value={pathRow.progress_percentage} size="3" radius="xl" style={{ flex: 1 }} />
                        </Group>
                      </Box>
                      {!pathRow.is_completed && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          aria-label="Continue"
                          onClick={(e) => handleContinueLearning(pathRow.topic.id, e)}
                        >
                          <FaGraduationCap size={12} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Box>
                ))
              )}
            </Stack>
          </Box>

          <Divider mb="md" />

          <Box mb="md">
            <SectionLabel collapsed={false}>Recent conversations</SectionLabel>
            <Stack gap={2}>
              {convosLoading ? (
                <Loader size="sm" mx="auto" my="sm" />
              ) : !conversations?.length ? (
                <Text size="sm" c="dimmed" ta="center" mt="md">
                  No conversations yet
                </Text>
              ) : (
                conversations
                  .filter((conv) => !learningPaths?.some((lp) => lp.conversation_id === conv.id))
                  .filter((conv) => conv.conversation_type !== "system_design_learning")
                  .map((conv) => (
                    <Box
                      key={conv.id}
                      p="sm"
                      className="row-item"
                      onClick={() => handleConversationClick(conv)}
                    >
                      <Group gap="xs" align="center" wrap="nowrap">
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" lineClamp={1}>
                            {conv.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </Text>
                        </Box>
                        <Group gap={2} wrap="nowrap">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            aria-label="Edit title"
                            onClick={(e) => handleEditClick(conv, e)}
                          >
                            <FaEdit size={12} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            aria-label="Delete conversation"
                            onClick={(e) => handleDeleteClick(conv.id, e)}
                          >
                            <FaTrash size={12} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Box>
                  ))
              )}
            </Stack>
          </Box>
        </ScrollArea>
      ) : (
        <Box style={{ flex: 1, minHeight: 0 }} />
      )}

      <Box mt="auto" pt="md" style={{ borderTop: "1px solid var(--app-line)" }}>
        <Stack gap="xs">
          <NavItem
            icon={<FaUser size={16} />}
            label="Profile"
            active={path.startsWith("/profile")}
            collapsed={isCollapsed}
            onClick={() => navigate("/profile")}
          />
        </Stack>
      </Box>

      <Modal opened={!!editingConversation} onClose={() => setEditingConversation(null)} title="Edit conversation title" centered>
        <TextInput
          label="Title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          mb="md"
          data-autofocus
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setEditingConversation(null)}>
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} disabled={!editTitle.trim()}>
            Save
          </Button>
        </Group>
      </Modal>

      <Modal opened={!!deletingConversationId} onClose={() => setDeletingConversationId(null)} title="Delete conversation" centered>
        <Text size="sm" mb="md">
          Are you sure you want to delete this conversation? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeletingConversationId(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};