import { Box, Group, Text, Badge, Button, Modal, Textarea, Stack, ActionIcon } from "@mantine/core";
import { RiLightbulbLine, RiStickyNoteLine, RiDeleteBinLine, RiEditLine, RiExpandDiagonalLine } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMessageNote, getMessageNotes, updateMessageNote, deleteMessageNote } from "../api/learningPaths";
import type { MessageNoteResponse } from "../types/learning_paths/api_types";

interface LearningPathMessageProps {
  id: string;
  sender: "user" | "ai";
  content: string;
  code_snippet?: string | null;
  language?: string | null;
  timestamp: string;
  type?: "explanation" | "question" | "challenge" | "feedback" | "encouragement" | "assessment";
  next_action?: string;
  onOpenCodeDrawer?: (code: string, language: string, messageId: string) => void;
  onHint?: () => void;
}

const typeColor = (t: string) =>
  t === "explanation"
    ? "blue"
    : t === "question"
    ? "teal"
    : t === "challenge"
    ? "orange"
    : t === "feedback"
    ? "green"
    : t === "encouragement"
    ? "violet"
    : "red";

const typeLabel = (t: string) =>
  t === "explanation"
    ? "Lesson"
    : t === "question"
    ? "Question"
    : t === "challenge"
    ? "Challenge"
    : t === "feedback"
    ? "Feedback"
    : t === "encouragement"
    ? "Nice work"
    : t === "assessment"
    ? "Checkpoint"
    : t;

export const LearningPathMessage = ({
  id,
  sender,
  content,
  code_snippet,
  language,
  timestamp,
  type,
  next_action,
  onOpenCodeDrawer,
  onHint,
}: LearningPathMessageProps) => {

  const queryClient = useQueryClient();
  const markdownRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<MessageNoteResponse | null>(null);
  const [viewNoteModalOpen, setViewNoteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch notes for this message with caching
  // Disabled for temp- messages (frontend-generated IDs before backend saves)
  // staleTime: prevents refetching for 10 minutes (treats data as fresh)
  // gcTime: keeps cached data in memory for 15 minutes after component unmounts
  const { data: notes = [] } = useQuery<MessageNoteResponse[]>({
    queryKey: ["message-notes", id],
    queryFn: () => getMessageNotes(id),
    enabled: !!id && !id.startsWith("temp-"),
    staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh
    gcTime: 15 * 60 * 1000, // 15 minutes - cache garbage collection time
  });

  const createNoteMutation = useMutation({
    mutationFn: createMessageNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-notes", id] });
      setNoteModalOpen(false);
      setNoteContent("");
      setSelection(null);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      updateMessageNote(noteId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-notes", id] });
      setViewNoteModalOpen(false);
      setNoteModalOpen(false);
      setNoteContent("");
      setEditingNote(null);
      setSelection(null);
      setIsEditMode(false);
    },
    onError: (error) => {
      console.error("Failed to update note:", error);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => {
      return deleteMessageNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-notes", id] });
      setContextMenu({ visible: false, x: 0, y: 0 });
      setViewNoteModalOpen(false);
      setNoteModalOpen(false);
      setEditingNote(null);
      setNoteContent("");
      setSelection(null);
    },
    onError: (error) => {
      console.error("Failed to delete note:", error);
    },
  });

  const handleMouseUp = () => {
    const el = markdownRef.current;
    if (!el) return;

    const selectionObj = window.getSelection();
    if (!selectionObj || selectionObj.isCollapsed) return;

    const selectedText = selectionObj.toString().trim();
    if (!selectedText) return;

    // Get the range to find actual position in content
    const range = selectionObj.getRangeAt(0);
    
    // Calculate position relative to the content string
    // We need to find where this selection starts in the original content
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(el);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + selectedText.length;

    setSelection({ start, end, text: selectedText });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const target = e.target as HTMLElement;
    const noteElement = target.closest("[data-note-id]");
    
    if (noteElement) {
      const noteId = noteElement.getAttribute("data-note-id");
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setEditingNote(note);
        setSelection({ start: note.selection_start, end: note.selection_end, text: note.selection_text });
      }
    }
    
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ ...contextMenu, visible: false });
      if (!noteModalOpen && !viewNoteModalOpen) {
        setEditingNote(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu, noteModalOpen, viewNoteModalOpen]);

  const handleHighlightClick = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    const noteElement = target.closest("[data-note-id]");
    
    if (noteElement) {
      const noteId = noteElement.getAttribute("data-note-id");
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setEditingNote(note);
        setNoteContent(note.content);
        setSelection({ start: note.selection_start, end: note.selection_end, text: note.selection_text });
        setViewNoteModalOpen(true);
        setIsEditMode(false);
      }
    }
  }, [notes]);

  // Render content with highlighted notes
  const renderContentWithHighlights = () => {
    // Always render the full markdown content
    const renderedContent = <ReactMarkdown>{content}</ReactMarkdown>;
    
    if (notes.length === 0) {
      return renderedContent;
    }

    // After rendering, we'll use a ref callback to add highlights to the DOM
    return renderedContent;
  };

  // Add highlights after markdown is rendered
  useEffect(() => {
    const el = markdownRef.current;
    if (!el || notes.length === 0) return;

    // Remove existing highlights
    el.querySelectorAll('.note-highlight').forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize(); // Merge adjacent text nodes
      }
    });

    // Add new highlights
    notes.forEach(note => {
      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentNode;
      let charCount = 0;
      const nodesToHighlight: Array<{node: Text, start: number, end: number}> = [];

      // Find text nodes that contain the selection
      while ((currentNode = walker.nextNode())) {
        const nodeText = currentNode.textContent || '';
        const nodeStart = charCount;
        const nodeEnd = charCount + nodeText.length;

        // Check if this node intersects with the note selection
        if (nodeEnd > note.selection_start && nodeStart < note.selection_end) {
          const highlightStart = Math.max(0, note.selection_start - nodeStart);
          const highlightEnd = Math.min(nodeText.length, note.selection_end - nodeStart);
          
          nodesToHighlight.push({
            node: currentNode as Text,
            start: highlightStart,
            end: highlightEnd
          });
        }

        charCount += nodeText.length;
      }

      // Apply highlights
      nodesToHighlight.forEach(({ node, start, end }) => {
        const text = node.textContent || '';
        const before = text.substring(0, start);
        const highlighted = text.substring(start, end);
        const after = text.substring(end);

        const fragment = document.createDocumentFragment();
        
        if (before) fragment.appendChild(document.createTextNode(before));
        
        const mark = document.createElement('mark');
        mark.className = 'note-highlight';
        mark.setAttribute('data-note-id', note.id);
        mark.style.backgroundColor = 'var(--mantine-color-yellow-1)';
        mark.style.borderBottom = '2px solid var(--mantine-color-yellow-4)';
        mark.style.cursor = 'pointer';
        mark.style.padding = '2px 0';
        mark.title = `Note: ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}`;
        mark.textContent = highlighted;
        mark.addEventListener('click', handleHighlightClick);
        fragment.appendChild(mark);
        
        if (after) fragment.appendChild(document.createTextNode(after));

        node.parentNode?.replaceChild(fragment, node);
      });
    });
  }, [notes, content, handleHighlightClick]);

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: sender === "user" ? "flex-end" : "flex-start",
      }}
    >
      <Box
        p="sm"
        className="app-bubble"
        style={{
          backgroundColor: sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)",
          maxWidth: "70%",
          position: "relative",
          overflowX: "auto",
        }}
      >
        {sender === "ai" && type && (
          <Group gap="xs" mb="xs">
            <Badge size="xs" variant="light" color={typeColor(type)} tt="capitalize">
              {typeLabel(type)}
            </Badge>
          </Group>
        )}

        <div
          ref={markdownRef}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          className="md-content"
          style={{ padding: "10px", userSelect: "text" }}
        >
          {renderContentWithHighlights()}
        </div>


        {code_snippet && (
          <Box w="100%" mt="sm">
            <Group justify="space-between" mb={4}>
              <Text size="xs" fw={600} c="dimmed">
                {language === "python" ? "🐍 Python" : language || "Code"}
              </Text>
              {onOpenCodeDrawer && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  rightSection={<RiExpandDiagonalLine size={13} />}
                  onClick={() => onOpenCodeDrawer(code_snippet, language || "python", id)}
                >
                  Open in Editor
                </Button>
              )}
            </Group>
            <Box
              style={{
                border: "1px solid var(--app-line)",
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
              }}
              p={0}
            >
              <Editor
                height="180px"
                language={language || "python"}
                value={code_snippet}
                options={{
                  readOnly: true,
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  domReadOnly: true,
                  contextmenu: false,
                }}
              />
            </Box>
          </Box>
        )}

        {next_action && (
          <Text size="xs" c="dimmed" mt="xs" style={{ fontStyle: "italic" }}>
            💡 {next_action}
          </Text>
        )}
      </Box>

      <Group gap="xs" mt="xs">
        <Text size="xs" c="dimmed" ta={sender === "user" ? "right" : "left"}>
          {new Date(timestamp).toLocaleTimeString()}
        </Text>

        {sender === "ai" && type === "challenge" && (
          <Button size="xs" variant="light" leftSection={<RiLightbulbLine size={12} />} onClick={onHint}>
            Hint
          </Button>
        )}
      </Group>


      {/* Custom context menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: "var(--app-surface)",
            border: "1px solid var(--app-line)",
            borderRadius: "var(--mantine-radius-md)",
            boxShadow: "var(--mantine-shadow-lg)",
            zIndex: 1000,
            minWidth: "200px",
            padding: 4,
            overflow: "hidden",
          }}
        >
          {editingNote ? (
            <>
              <div
                className="nav-item"
                style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderRadius: 6 }}
                onClick={() => {
                  setNoteContent(editingNote.content);
                  setNoteModalOpen(true);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <RiStickyNoteLine size={14} />
                <Text size="sm">View/Edit Note</Text>
              </div>
              <div
                className="nav-item"
                style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderRadius: 6, color: "#fa5252" }}
                onClick={() => {
                  deleteNoteMutation.mutate(editingNote.id);
                }}
              >
                <RiDeleteBinLine size={14} />
                <Text size="sm">Delete Note</Text>
              </div>
            </>
          ) : (
            <div
              className="nav-item"
              style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderRadius: 6 }}
              onClick={() => {
                if (selection) {
                  setNoteModalOpen(true);
                }
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <RiStickyNoteLine size={14} />
              <Text size="sm">Add a note</Text>
            </div>
          )}
          <div
            style={{
              padding: "8px 12px",
              cursor: "not-allowed",
              color: "var(--mantine-color-dimmed)",
            }}
          >
            <Text size="sm">Explore in another branch (coming soon)</Text>
          </div>
        </div>
      )}

      {/* Note View/Edit Modal */}
      <Modal
        opened={viewNoteModalOpen}
        onClose={() => {
          setViewNoteModalOpen(false);
          setEditingNote(null);
          setIsEditMode(false);
        }}
        title={
          <Group justify="space-between" style={{ width: "100%" }}>
            <Text fw={600}>{isEditMode ? "Edit Note" : "Note"}</Text>
            {!isEditMode && (
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={() => setIsEditMode(true)}
                  title="Edit note"
                >
                  <RiEditLine size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => {
                    deleteNoteMutation.mutate(editingNote!.id);
                  }}
                  title="Delete note"
                  loading={deleteNoteMutation.isPending}
                >
                  <RiDeleteBinLine size={18} />
                </ActionIcon>
              </Group>
            )}
          </Group>
        }
        size="lg"
      >
        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Selected Text:
            </Text>
            <Box
              p="sm"
              style={{
                backgroundColor: "var(--mantine-color-yellow-1)",
                borderRadius: "4px",
                border: "1px solid var(--mantine-color-yellow-4)",
              }}
            >
              <Text size="sm" style={{ fontStyle: "italic" }}>
                "{selection?.text}"
              </Text>
            </Box>
          </Box>

          {isEditMode ? (
            <>
              <Textarea
                label="Your Note"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                minRows={6}
                autoFocus
              />
              <Group justify="flex-end">
                <Button
                  variant="default"
                  onClick={() => {
                    setIsEditMode(false);
                    setNoteContent(editingNote?.content || "");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  leftSection={<RiStickyNoteLine size={16} />}
                  onClick={() => {
                    if (editingNote && noteContent.trim()) {
                      updateNoteMutation.mutate({
                        noteId: editingNote.id,
                        content: noteContent,
                      });
                    }
                  }}
                  disabled={!noteContent.trim() || updateNoteMutation.isPending}
                  loading={updateNoteMutation.isPending}
                >
                  Update Note
                </Button>
              </Group>
            </>
          ) : (
            <Box>
              <Text size="sm" fw={500} mb="xs">
                Note:
              </Text>
              <Box
                p="md"
                style={{
                  backgroundColor: "var(--app-sunken)",
                  borderRadius: "4px",
                  border: "1px solid var(--app-line)",
                }}
              >
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {noteContent}
                </Text>
              </Box>
            </Box>
          )}
        </Stack>
      </Modal>

      {/* Note Creation Modal */}
      <Modal
        opened={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setNoteContent("");
        }}
        title="Add Note"
        size="lg"
      >
        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Selected Text:
            </Text>
            <Box
              p="sm"
              style={{
                backgroundColor: "var(--mantine-color-yellow-1)",
                borderRadius: "4px",
                border: "1px solid var(--mantine-color-yellow-4)",
              }}
            >
              <Text size="sm" style={{ fontStyle: "italic" }}>
                "{selection?.text}"
              </Text>
            </Box>
          </Box>

          <Textarea
            label="Your Note"
            placeholder="Add your thoughts, questions, or insights about this text..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            minRows={6}
            autoFocus
          />

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setNoteModalOpen(false);
                setNoteContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              leftSection={<RiStickyNoteLine size={16} />}
              onClick={() => {
                if (selection && noteContent.trim()) {
                  createNoteMutation.mutate({
                    message_id: id,
                    selection_start: selection.start,
                    selection_end: selection.end,
                    selection_text: selection.text,
                    content: noteContent,
                  });
                }
              }}
              disabled={!noteContent.trim() || createNoteMutation.isPending}
              loading={createNoteMutation.isPending}
            >
              Save Note
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
