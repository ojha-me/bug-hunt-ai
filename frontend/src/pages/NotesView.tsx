import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Text,
  TextInput,
  Card,
  Stack,
  Group,
  Badge,
  ActionIcon,
  Skeleton,
  Box,
} from "@mantine/core";
import { RiSearchLine, RiStickyNoteLine, RiBookOpenLine, RiArrowRightLine } from "react-icons/ri";
import { useQuery } from "@tanstack/react-query";
import { getAllUserNotes } from "../api/learningPaths";
import { Page, PageHeader, EmptyState } from "../components/ui";
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
      <Page>
        <PageHeader title="My Notes" subtitle="All your learning notes in one place" />
        <Stack gap="md">
          <Skeleton height={44} radius="md" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} radius="lg" />
          ))}
        </Stack>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="My Notes"
        subtitle="All your learning notes in one place"
        right={
          <Badge size="lg" variant="light" leftSection={<RiStickyNoteLine />}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Badge>
        }
      />

      <TextInput
        placeholder="Search notes by content or highlighted text..."
        leftSection={<RiSearchLine />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        size="md"
        mb="lg"
      />

      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<RiStickyNoteLine />}
          iconColor="gray"
          title={searchQuery ? "No notes found matching your search" : "No notes yet"}
          description={!searchQuery ? "Start taking notes by highlighting text in your learning conversations" : undefined}
        />
      ) : (
        <Stack gap="md" className="app-stagger">
          {Object.entries(groupedNotes).map(([pathKey, pathGroup]) => (
            <Card
              key={pathKey}
              p="lg"
              withBorder
              className="app-hover-lift"
              style={{
                cursor: pathGroup.learningPathId ? "pointer" : "default",
              }}
              onClick={() => pathGroup.learningPathId && navigate(`/learning-path/${pathGroup.learningPathId}/notes`)}
            >
              <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="md">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--mantine-radius-md)",
                      background: "var(--brand-gradient)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <RiBookOpenLine size={24} color="white" />
                  </Box>
                  <div>
                    <Text fw={650} size="lg">
                      {pathGroup.learningPathName}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {pathGroup.learningPathId
                        ? "View all notes for this learning path"
                        : "Ungrouped general notes"}
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
    </Page>
  );
};