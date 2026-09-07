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
  ActionIcon,
  Tooltip,
  Group,
  Collapse,
} from "@mantine/core";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaGraduationCap,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
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
  FaClock,
  FaFolder,
  FaLayerGroup,
} from "react-icons/fa";
import { RiStickyNoteLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";
import { getConversations, createConversation, updateConversationTitle, deleteConversation } from "../api/conversation";
import { userLearningPaths } from "../api/learningPaths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationResponse } from "../types/ai_core/api_types";
import { notifications } from "@mantine/notifications";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import type { UserLearningPathResponse } from "../types/learning_paths/api_types";
import { useSidebar } from "../contexts/SidebarContext";
import { brandGradient } from "../theme";

const WIDTH = 288;
const WIDTH_COLLAPSED = 64;

const RECENT_PAGES_KEY = "sidebar-recent-pages";
const EXPANDED_GROUPS_KEY = "sidebar-expanded-groups";

interface RecentPage {
  path: string;
  label: string;
  ts: number;
}

function getPageMeta(pathname: string): { label: string; icon: ReactNode } {
  if (pathname === "/") return { label: "Dashboard", icon: <FaHome size={14} /> };
  if (pathname.startsWith("/topics") || pathname.startsWith("/learning-path")) return { label: "Learning Paths", icon: <FaGraduationCap size={14} /> };
  if (pathname.startsWith("/challenges")) return { label: pathname.includes("/challenges/") ? "Coding Problem" : "Coding Problems", icon: <FaCode size={14} /> };
  if (pathname.startsWith("/mock")) return { label: "Mock Interview", icon: <FaStopwatch size={14} /> };
  if (pathname.startsWith("/behavioral")) return { label: "Behavioral Prep", icon: <FaComments size={14} /> };
  if (pathname.startsWith("/system-design/components")) return { label: "Components", icon: <FaCubes size={14} /> };
  if (pathname.startsWith("/system-design/case-studies")) return { label: "Case Studies", icon: <FaBook size={14} /> };
  if (pathname.startsWith("/system-design/practice")) return { label: "Design Drills", icon: <FaDumbbell size={14} /> };
  if (pathname.startsWith("/system-design")) return { label: "System Design", icon: <FaProjectDiagram size={14} /> };
  if (pathname.startsWith("/revision")) return { label: "Review Queue", icon: <FaRedoAlt size={14} /> };
  if (pathname.startsWith("/notes")) return { label: "My Notes", icon: <RiStickyNoteLine size={14} /> };
  if (pathname.startsWith("/profile")) return { label: "Profile", icon: <FaUser size={14} /> };
  if (pathname.startsWith("/conversation")) return { label: "Chat", icon: <FaComments size={14} /> };
  if (pathname.startsWith("/component-tutor")) return { label: "Component Tutor", icon: <FaCubes size={14} /> };
  return { label: "Page", icon: <FaFolder size={14} /> };
}

function useRecentPages(currentPath: string) {
  const [recentPages, setRecentPages] = useState<RecentPage[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_PAGES_KEY);
      return raw ? (JSON.parse(raw) as RecentPage[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!currentPath || currentPath.startsWith("/login")) return;
    // don't track bare conversation ids as pages if desired - but we track all for hybrid dedupe
    const label = getPageMeta(currentPath).label;
    const entry: RecentPage = { path: currentPath, label, ts: Date.now() };
    try {
      const raw = localStorage.getItem(RECENT_PAGES_KEY);
      const prev: RecentPage[] = raw ? JSON.parse(raw) : [];
      // dedupe: remove existing same path, put front
      const filtered = prev.filter((p) => p.path !== currentPath);
      const next = [entry, ...filtered].slice(0, 10);
      localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(next));
      setRecentPages(next);
    } catch {
      // ignore
    }
  }, [currentPath]);

  const clear = () => {
    try {
      localStorage.removeItem(RECENT_PAGES_KEY);
    } catch {}
    setRecentPages([]);
  };

  return { recentPages, clear };
}

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

interface CollapsibleSectionProps {
  id: string;
  label: string;
  icon: ReactNode;
  collapsed: boolean;
  isActive: boolean;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection = ({ id, label, icon, collapsed, isActive, children, defaultExpanded = true }: CollapsibleSectionProps) => {
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_GROUPS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      if (isActive) return true;
      if (id in map) return map[id];
      return defaultExpanded;
    } catch {
      return defaultExpanded;
    }
  });

  useEffect(() => {
    if (isActive && !expanded) {
      setExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_GROUPS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      map[id] = expanded;
      localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(map));
    } catch {}
  }, [id, expanded]);

  if (collapsed) {
    return <Stack gap={2}>{children}</Stack>;
  }

  return (
    <Box>
      <UnstyledButton
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0.4rem 0.5rem",
          borderRadius: "var(--mantine-radius-md)",
          background: isActive ? "var(--mantine-primary-color-light-hover)" : "transparent",
        }}
      >
        <Group gap={8} wrap="nowrap">
          <Box c={isActive ? "var(--mantine-primary-color-filled)" : "dimmed"} style={{ display: "flex" }}>
            {icon}
          </Box>
          <Text size="xs" fw={700} tt="uppercase" c={isActive ? "var(--mantine-primary-color-filled)" : "dimmed"} style={{ letterSpacing: 0.4 }}>
            {label}
          </Text>
        </Group>
        <FaChevronDown
          size={10}
          style={{
            transition: "transform 180ms var(--ease-out)",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            opacity: 0.6,
          }}
        />
      </UnstyledButton>
      <Collapse in={expanded}>
        <Stack gap={2} mt={6} pl={4} style={{ borderLeft: isActive ? "2px solid var(--mantine-primary-color-light-color)" : "2px solid transparent" }}>
          {children}
        </Stack>
      </Collapse>
    </Box>
  );
};

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [editingConversation, setEditingConversation] = useState<ConversationResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const path = location.pathname;
  const { recentPages, clear: clearRecentPages } = useRecentPages(path);

  const { data: conversations, isLoading: convosLoading } = useQuery<ConversationResponse[]>({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const { data: learningPaths } = useQuery<UserLearningPathResponse[]>({
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

  const isSystemDesign =
    path.startsWith("/system-design") &&
    !path.startsWith("/system-design/case-studies") &&
    !path.startsWith("/system-design/practice") &&
    !path.startsWith("/system-design/components");
  const isCaseStudies = path.startsWith("/system-design/case-studies");
  const isPractice = path.startsWith("/system-design/practice");
  const isComponents = path.startsWith("/system-design/components");

  const isCodingActive =
    path.startsWith("/topics") ||
    path.startsWith("/learning-path") ||
    path.startsWith("/challenges") ||
    path.startsWith("/foundations") ||
    path.startsWith("/patterns") ||
    path.startsWith("/mock");
  const isSDActive = path.startsWith("/system-design");
  const isReviewActive = path === "/" || path.startsWith("/behavioral") || path.startsWith("/revision") || path.startsWith("/notes");

  const hybridRecent = useMemo(() => {
    const pages = recentPages.filter((p) => p.path !== path).slice(0, 4);
    const filteredConvos = (conversations || [])
      .filter((conv) => !learningPaths?.some((lp) => lp.conversation_id === conv.id))
      .filter((conv) => conv.conversation_type !== "system_design_learning")
      .slice(0, 3);
    // dedupe by path vs convo id already separate
    // total max 7
    return { pages, convos: filteredConvos };
  }, [recentPages, conversations, learningPaths, path]);

  const hasHybrid = hybridRecent.pages.length > 0 || hybridRecent.convos.length > 0;

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

      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto">
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

        {/* Recent - Hybrid top section */}
        {!isCollapsed && hasHybrid && (
          <Box>
            <Group justify="space-between" mb={4} wrap="nowrap">
              <Group gap={6} wrap="nowrap">
                <FaClock size={11} style={{ opacity: 0.6 }} />
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.4 }}>
                  Recent
                </Text>
              </Group>
              {hybridRecent.pages.length > 0 && (
                <UnstyledButton onClick={clearRecentPages}>
                  <Text size="xs" c="dimmed" style={{ fontSize: 11 }}>
                    Clear
                  </Text>
                </UnstyledButton>
              )}
            </Group>
            <Stack gap={2}>
              {hybridRecent.pages.map((rp) => {
                const meta = getPageMeta(rp.path);
                const isActive = path === rp.path;
                return (
                  <UnstyledButton
                    key={`rp-${rp.path}`}
                    onClick={() => navigate(rp.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0.45rem 0.6rem",
                      borderRadius: "var(--mantine-radius-md)",
                      width: "100%",
                      background: isActive ? "var(--mantine-primary-color-light)" : "transparent",
                      color: isActive ? "var(--mantine-primary-color-filled)" : "var(--mantine-color-text)",
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    <Box style={{ opacity: 0.7, display: "flex" }}>{meta.icon}</Box>
                    <Text size="sm" lineClamp={1} style={{ flex: 1, textAlign: "left" }}>
                      {meta.label}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                      {rp.path.length > 18 ? "…" + rp.path.slice(-16) : ""}
                    </Text>
                  </UnstyledButton>
                );
              })}
              {hybridRecent.pages.length > 0 && hybridRecent.convos.length > 0 && <Divider my={4} />}
              {hybridRecent.convos.map((conv) => (
                <UnstyledButton
                  key={`rc-${conv.id}`}
                  onClick={() => handleConversationClick(conv)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0.45rem 0.6rem",
                    borderRadius: "var(--mantine-radius-md)",
                    width: "100%",
                    background: "transparent",
                  }}
                >
                  <Box style={{ opacity: 0.6, display: "flex" }}>
                    <FaComments size={12} />
                  </Box>
                  <Box style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <Text size="sm" lineClamp={1} lh={1.2}>
                      {conv.title}
                    </Text>
                    <Text size="xs" c="dimmed" lh={1}>
                      chat • {new Date(conv.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                </UnstyledButton>
              ))}
            </Stack>
            <Divider mt="sm" />
          </Box>
        )}
        {isCollapsed && hasHybrid && (
          <Stack gap={2} align="center">
            {hybridRecent.pages.slice(0, 3).map((rp) => {
              const meta = getPageMeta(rp.path);
              return (
                <Tooltip key={`c-rp-${rp.path}`} label={`${meta.label} • ${rp.path}`} position="right" withArrow>
                  <ActionIcon variant="default" size="xl" radius="md" onClick={() => navigate(rp.path)}>
                    {meta.icon}
                  </ActionIcon>
                </Tooltip>
              );
            })}
            {hybridRecent.convos.slice(0, 2).map((conv) => (
              <Tooltip key={`c-rc-${conv.id}`} label={conv.title} position="right" withArrow>
                <ActionIcon variant="default" size="xl" radius="md" onClick={() => handleConversationClick(conv)}>
                  <FaComments size={14} />
                </ActionIcon>
              </Tooltip>
            ))}
            <Divider w="60%" my={4} />
          </Stack>
        )}

        {/* Nested groups */}
        <CollapsibleSection id="coding" label="Coding" icon={<FaCode size={14} />} collapsed={isCollapsed} isActive={isCodingActive}>
          <NavItem
            icon={<FaGraduationCap size={16} />}
            label="Learning Paths"
            active={path.startsWith("/topics") || path.startsWith("/learning-path")}
            collapsed={isCollapsed}
            onClick={() => navigate("/topics")}
          />
          <NavItem
            icon={<FaCubes size={16} />}
            label="Foundations"
            active={path.startsWith("/foundations")}
            collapsed={isCollapsed}
            onClick={() => navigate("/foundations")}
          />
          <NavItem
            icon={<FaLayerGroup size={16} />}
            label="Patterns"
            active={path.startsWith("/patterns")}
            collapsed={isCollapsed}
            onClick={() => navigate("/patterns")}
          />
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
        </CollapsibleSection>

        <CollapsibleSection id="system-design" label="System Design" icon={<FaProjectDiagram size={14} />} collapsed={isCollapsed} isActive={isSDActive}>
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
        </CollapsibleSection>

        <CollapsibleSection id="prep-review" label="Prep & Review" icon={<FaBook size={14} />} collapsed={isCollapsed} isActive={isReviewActive}>
          <NavItem
            icon={<FaHome size={16} />}
            label="Dashboard"
            active={path === "/"}
            collapsed={isCollapsed}
            onClick={() => navigate("/")}
          />
          <NavItem
            icon={<FaComments size={16} />}
            label="Behavioral Prep"
            active={path.startsWith("/behavioral")}
            collapsed={isCollapsed}
            onClick={() => navigate("/behavioral")}
          />
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
        </CollapsibleSection>
      </Stack>

      {!isCollapsed && (
        <>
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
        </>
      )}
      </ScrollArea>

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
