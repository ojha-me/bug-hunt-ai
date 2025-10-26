import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mantine/core";
import { RiSearchLine, RiStickyNoteLine, RiBookOpenLine, RiArrowRightLine } from "react-icons/ri";
import { useQuery } from "@tanstack/react-query";
import { getAllUserNotes } from "../api/learningPaths";
import type { MessageNoteResponse } from "../types/learning_paths/api_types";

export const NotesView = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notes = [], isLoading } = useQuery<MessageNoteResponse[]>({
    queryKey: ["all-user-notes"],
    queryFn: getAllUserNotes,
  });

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const query = searchQuery.toLowerCase();
      return (
        note.content.toLowerCase().includes(query) ||
        note.selection_text.toLowerCase().includes(query) ||
        (note.learning_path_name && note.learning_path_name.toLowerCase().includes(query)) ||
        (note.subtopic_name && note.subtopic_name.toLowerCase().includes(query))
      );
    });
  }, [notes, searchQuery]);

  // Group notes by learning path only
  const groupedNotes = useMemo(() => {
    const groups: Record<string, {
      learningPathId: string | null;
      learningPathName: string;
      noteCount: number;
      subtopicCount: number;
    }> = {};

    filteredNotes.forEach((note) => {
      const pathKey = note.learning_path_id || 'general';
      const pathName = note.learning_path_name || 'General Notes';

      if (!groups[pathKey]) {
        groups[pathKey] = {
          learningPathId: note.learning_path_id || null,
          learningPathName: pathName,
          noteCount: 0,
          subtopicCount: 0,
        };
      }

      groups[pathKey].noteCount++;
    });

    return groups;
  }, [filteredNotes]);


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
        {/* Header */}
        <Box>
          <Group justify="space-between" align="center" mb="md">
            <div>
              <Title order={1}>My Notes</Title>
              <Text c="dimmed" size="sm">
                All your learning notes in one place
              </Text>
            </div>
            <Badge size="lg" variant="light" leftSection={<RiStickyNoteLine />}>
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </Badge>
          </Group>

          {/* Search */}
          <TextInput
            placeholder="Search notes by content or highlighted text..."
            leftSection={<RiSearchLine />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            size="md"
          />
        </Box>

        {/* Learning Paths Overview */}
        {filteredNotes.length === 0 ? (
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Stack align="center" gap="sm">
                <RiStickyNoteLine size={48} style={{ opacity: 0.3 }} />
                <Text c="dimmed" size="lg">
                  {searchQuery ? "No notes found matching your search" : "No notes yet"}
                </Text>
                <Text c="dimmed" size="sm">
                  {!searchQuery && "Start taking notes by highlighting text in your learning conversations"}
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Stack gap="md">
            {Object.entries(groupedNotes).map(([pathKey, pathGroup]) => (
              <Card
                key={pathKey}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ 
                  cursor: pathGroup.learningPathId ? "pointer" : "default",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (pathGroup.learningPathId) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
                onClick={() => pathGroup.learningPathId && navigate(`/learning-path/${pathGroup.learningPathId}/notes`)}
              >
                <Group justify="space-between" align="center">
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RiBookOpenLine size={24} color="white" />
                    </Box>
                    <div>
                      <Title order={3}>{pathGroup.learningPathName}</Title>
                      <Text size="sm" c="dimmed">
                        Click to view all notes for this learning path
                      </Text>
                    </div>
                  </Group>
                  <Group gap="md">
                    <Badge size="lg" variant="light" color="blue">
                      {pathGroup.noteCount} {pathGroup.noteCount === 1 ? "note" : "notes"}
                    </Badge>
                    {pathGroup.learningPathId && (
                      <ActionIcon variant="subtle" size="lg">
                        <RiArrowRightLine size={20} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
