import { Box, Group, Text, Badge, Button, Modal, Textarea, Stack, ActionIcon } from "@mantine/core";
import { RiCodeLine, RiLightbulbLine, RiStickyNoteLine, RiDeleteBinLine, RiEditLine } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
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
}

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

  const { data: notes = [] } = useQuery<MessageNoteResponse[]>({
    queryKey: ["message-notes", id],
    queryFn: () => getMessageNotes(id),
    enabled: !!id && !id.startsWith("temp-"),
  });

  console.log(notes,"herna de notes k chha")

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
      console.log("Note updated successfully");
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
      console.log("Delete mutation called with noteId:", noteId);
      return deleteMessageNote(noteId);
    },
    onSuccess: (data) => {
      console.log("Note deleted successfully, response:", data);
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
      console.log("Highlighted text clicked, noteId:", noteId);
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        console.log("Note found:", note);
        setEditingNote(note);
        setNoteContent(note.content);
        setSelection({ start: note.selection_start, end: note.selection_end, text: note.selection_text });
        setViewNoteModalOpen(true);
        setIsEditMode(false);
      } else {
        console.log("Note not found in notes array");
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
        mark.style.backgroundColor = '#fff9db';
        mark.style.borderBottom = '2px solid #ffd43b';
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
        style={{
          backgroundColor: sender === "user" ? "#e3f2fd" : "#f5f5f5",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          maxWidth: "70%",
          position: "relative",
        }}
      >
        {sender === "ai" && type && (
          <Group gap="xs" mb="xs">
            <Text size="xs">{""}</Text>
            <Badge size="xs" variant="light">
              {type}
            </Badge>
          </Group>
        )}

        <div
          ref={markdownRef}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          style={{ padding: "10px", userSelect: "text" }}
        >
          {renderContentWithHighlights()}
        </div>


        {code_snippet && (
          <Box mt="sm">
            <Box
              p="sm"
              style={{
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "12px",
                border: "1px solid #e9ecef",
              }}
            >
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{code_snippet}</pre>
            </Box>
            {onOpenCodeDrawer && (
              <Button
                size="xs"
                variant="light"
                leftSection={<RiCodeLine size={14} />}
                mt="xs"
                onClick={() => onOpenCodeDrawer(code_snippet, language || "python", id)}
              >
                Open in Editor
              </Button>
            )}
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
          <Button size="xs" variant="light" leftSection={<RiLightbulbLine size={12} />}>
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
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 1000,
            minWidth: "180px",
          }}
        >
          {editingNote ? (
            <>
              <div
                style={{ padding: "8px 12px", cursor: "pointer" }}
                onClick={() => {
                  setNoteContent(editingNote.content);
                  setNoteModalOpen(true);
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                📝 View/Edit Note
              </div>
              <div
                style={{ padding: "8px 12px", cursor: "pointer", color: "#fa5252" }}
                onClick={() => {
                    deleteNoteMutation.mutate(editingNote.id);
                }}
              >
                🗑️ Delete Note
              </div>
            </>
          ) : (
            <div
              style={{ padding: "8px 12px", cursor: "pointer" }}
              onClick={() => {
                if (selection) {
                  setNoteModalOpen(true);
                }
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              📝 Add a note
            </div>
          )}
          <div
            style={{
              padding: "8px 12px",
              cursor: "not-allowed",
              color: "gray",
            }}
          >
            Explore in another branch (coming soon)
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
                backgroundColor: "#fff9db",
                borderRadius: "4px",
                border: "1px solid #ffd43b",
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
                      console.log("Updating note:", editingNote.id, noteContent);
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
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px solid #e9ecef",
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
                backgroundColor: "#fff9db",
                borderRadius: "4px",
                border: "1px solid #ffd43b",
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
