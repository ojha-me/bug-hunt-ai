import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  TextInput,
  Card,
  Stack,
  Group,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Paper,
  Box,
  Modal,
  Textarea,
  Button,
  Accordion,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import { RiSearchLine, RiDeleteBinLine, RiEditLine, RiStickyNoteLine, RiFileListLine, RiArrowLeftLine } from "react-icons/ri";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUserNotes, updateMessageNote, deleteMessageNote, topicDetails } from "../api/learningPaths";
import type { MessageNoteResponse, LearningTopicDetailResponse } from "../types/learning_paths/api_types";

export const LearningPathNotesView = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<MessageNoteResponse | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState("");

  // Fetch learning path details
  const { data: learningPathDetail } = useQuery<LearningTopicDetailResponse>({
    queryKey: ["learning-path", pathId],
    queryFn: () => topicDetails(pathId!),
    enabled: !!pathId,
  });

  // Fetch all notes
  const { data: allNotes = [], isLoading } = useQuery<MessageNoteResponse[]>({
    queryKey: ["all-user-notes"],
    queryFn: getAllUserNotes,
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      updateMessageNote(noteId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-notes"] });
      setEditModalOpen(false);
      setEditingNote(null);
      setEditContent("");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteMessageNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-notes"] });
    },
  });

  // Filter notes for this specific learning path
  const pathNotes = useMemo(() => {
    return allNotes.filter((note) => note.learning_path_id === pathId);
  }, [allNotes, pathId]);

  const filteredNotes = useMemo(() => {
    return pathNotes.filter((note) => {
      const query = searchQuery.toLowerCase();
      return (
        note.content.toLowerCase().includes(query) ||
        note.selection_text.toLowerCase().includes(query) ||
        (note.subtopic_name && note.subtopic_name.toLowerCase().includes(query))
      );
    });
  }, [pathNotes, searchQuery]);

  // Group notes by subtopic
  const groupedNotes = useMemo(() => {
    const groups: Record<string, {
      subtopicId: string | null;
      subtopicName: string;
      notes: MessageNoteResponse[];
    }> = {};

    filteredNotes.forEach((note) => {
      const subtopicKey = note.subtopic_id || 'main';
      const subtopicName = note.subtopic_name || 'Overview';

      if (!groups[subtopicKey]) {
        groups[subtopicKey] = {
          subtopicId: note.subtopic_id || null,
          subtopicName: subtopicName,
          notes: [],
        };
      }

      groups[subtopicKey].notes.push(note);
    });

    return groups;
  }, [filteredNotes]);

  const handleEditClick = (note: MessageNoteResponse) => {
    setEditingNote(note);
    setEditContent(note.content);
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingNote && editContent.trim()) {
      updateNoteMutation.mutate({
        noteId: editingNote.id,
        content: editContent,
      });
    }
  };

  const handleDeleteClick = (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          <Anchor onClick={() => navigate("/notes")} style={{ cursor: "pointer" }}>
            All Notes
          </Anchor>
          <Text>{learningPathDetail?.name || "Loading..."}</Text>
        </Breadcrumbs>

        {/* Header */}
        <Box>
          <Group justify="space-between" align="center" mb="md">
            <div>
              <Group gap="sm">
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  onClick={() => navigate("/notes")}
                >
                  <RiArrowLeftLine size={20} />
                </ActionIcon>
                <div>
                  <Title order={1}>{learningPathDetail?.name || "Learning Path"}</Title>
                  <Text c="dimmed" size="sm">
                    Notes for this learning path
                  </Text>
                </div>
              </Group>
            </div>
            <Badge size="lg" variant="light" leftSection={<RiStickyNoteLine />}>
              {pathNotes.length} {pathNotes.length === 1 ? "note" : "notes"}
            </Badge>
          </Group>

          {/* Search */}
          <TextInput
            placeholder="Search notes by content, highlighted text, or subtopic..."
            leftSection={<RiSearchLine />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            size="md"
          />
        </Box>

        {/* Notes List - Grouped by Subtopic */}
        {filteredNotes.length === 0 ? (
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Stack align="center" gap="sm">
                <RiStickyNoteLine size={48} style={{ opacity: 0.3 }} />
                <Text c="dimmed" size="lg">
                  {searchQuery ? "No notes found matching your search" : "No notes yet for this learning path"}
                </Text>
                <Text c="dimmed" size="sm">
                  {!searchQuery && "Start taking notes by highlighting text in your learning conversations"}
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Accordion variant="separated" radius="md" defaultValue={Object.keys(groupedNotes)[0]}>
            {Object.entries(groupedNotes).map(([subtopicKey, subtopicGroup]) => (
              <Accordion.Item key={subtopicKey} value={subtopicKey}>
                <Accordion.Control icon={<RiFileListLine size={16} />}>
                  <Group justify="space-between" pr="md">
                    <Text fw={500}>{subtopicGroup.subtopicName}</Text>
                    <Badge size="sm" variant="dot">
                      {subtopicGroup.notes.length}
                    </Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {subtopicGroup.notes.map((note) => (
                      <Card key={note.id} shadow="sm" padding="md" radius="md" withBorder>
                        <Stack gap="sm">
                          {/* Note Header */}
                          <Group justify="space-between" align="flex-start">
                            <Box style={{ flex: 1 }}>
                              <Text size="xs" c="dimmed" mb={4}>
                                Highlighted Text:
                              </Text>
                              <Paper
                                p="xs"
                                bg="yellow.0"
                                style={{
                                  borderLeft: "3px solid #ffd43b",
                                  fontStyle: "italic",
                                }}
                              >
                                <Text size="sm">"{note.selection_text}"</Text>
                              </Paper>
                            </Box>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => handleEditClick(note)}
                                title="Edit note"
                              >
                                <RiEditLine size={18} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleDeleteClick(note.id)}
                                loading={deleteNoteMutation.isPending}
                                title="Delete note"
                              >
                                <RiDeleteBinLine size={18} />
                              </ActionIcon>
                            </Group>
                          </Group>

                          {/* Note Content */}
                          <Box>
                            <Text size="xs" c="dimmed" mb={4}>
                              Your Note:
                            </Text>
                            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                              {note.content}
                            </Text>
                          </Box>

                          {/* Note Footer */}
                          <Group justify="space-between" mt="xs">
                            <Text size="xs" c="dimmed">
                              Created: {formatDate(note.created_at)}
                            </Text>
                            {note.updated_at !== note.created_at && (
                              <Text size="xs" c="dimmed">
                                Updated: {formatDate(note.updated_at)}
                              </Text>
                            )}
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingNote(null);
          setEditContent("");
        }}
        title="Edit Note"
        size="lg"
      >
        <Stack gap="md">
          {editingNote && (
            <Paper p="sm" bg="yellow.0" style={{ borderLeft: "3px solid #ffd43b" }}>
              <Text size="xs" c="dimmed" mb={4}>
                Highlighted Text:
              </Text>
              <Text size="sm" style={{ fontStyle: "italic" }}>
                "{editingNote.selection_text}"
              </Text>
            </Paper>
          )}

          <Textarea
            label="Your Note"
            placeholder="Write your note here..."
            value={editContent}
            onChange={(e) => setEditContent(e.currentTarget.value)}
            minRows={4}
            autosize
          />

          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                setEditModalOpen(false);
                setEditingNote(null);
                setEditContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={updateNoteMutation.isPending}
              disabled={!editContent.trim()}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};
