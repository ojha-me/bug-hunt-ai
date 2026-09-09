import { useEffect, useMemo, useState } from "react";
import {
  Box, Group, Stack, Text, Button, Textarea, TextInput, Select, Badge, Card, Divider,
  RingProgress, ScrollArea, CopyButton, Tooltip, Loader, Menu, ActionIcon, Alert,
} from "@mantine/core";
import Editor from "@monaco-editor/react";
import { useMantineColorScheme } from "@mantine/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaPlus, FaSave, FaCopy, FaDownload, FaEllipsisV, FaTrash, FaStar, FaMagic, FaSearch, FaCheck, FaHistory, FaExternalLinkAlt,
} from "react-icons/fa";
import {
  listResumes, getResume, createResume, updateResume, deleteResume,
  reviewResume, tailorReview, listReviews, getReview,
  type ResumeReview,
} from "../api/resume";
import { DEFAULT_LATEX_RESUME } from "../data/resumeTemplate";

const scoreColor = (s: number) => (s >= 75 ? "teal" : s >= 50 ? "yellow" : s >= 30 ? "orange" : "red");

const CopyBtn = ({ value, label = "Copy" }: { value: string; label?: string }) => (
  <CopyButton value={value} timeout={1500}>
    {({ copied, copy }) => (
      <Button size="compact-xs" variant="subtle" color={copied ? "teal" : "gray"}
        leftSection={copied ? <FaCheck size={9} /> : <FaCopy size={9} />} onClick={copy}>
        {copied ? "Copied" : label}
      </Button>
    )}
  </CopyButton>
);

const KeywordChips = ({ items, color }: { items: string[]; color: string }) => (
  <Group gap={6}>
    {items.map((k, i) => <Badge key={i} variant="light" color={color} size="sm">{k}</Badge>)}
  </Group>
);

export const ResumeWorkspacePage = () => {
  const { colorScheme } = useMantineColorScheme();
  const qc = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("My Resume");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const [jd, setJd] = useState("");
  const [role, setRole] = useState("");
  const [review, setReview] = useState<ResumeReview | null>(null);

  const { data: resumes } = useQuery({ queryKey: ["resumes"], queryFn: listResumes });
  const { data: reviews } = useQuery({ queryKey: ["resume-reviews"], queryFn: listReviews });
  const { data: selectedResume } = useQuery({
    queryKey: ["resume", selectedId],
    queryFn: () => getResume(selectedId!),
    enabled: !!selectedId,
  });

  // Pick the primary/first resume once the list loads.
  useEffect(() => {
    if (selectedId || !resumes) return;
    if (resumes.length) setSelectedId(resumes.find((r) => r.is_primary)?.id ?? resumes[0].id);
  }, [resumes, selectedId]);

  // Load editor content when a different resume is selected.
  useEffect(() => {
    if (selectedResume && selectedResume.id !== loadedId) {
      setContent(selectedResume.content);
      setName(selectedResume.name);
      setDirty(false);
      setLoadedId(selectedResume.id);
    }
  }, [selectedResume, loadedId]);

  const ensureSaved = async (): Promise<string> => {
    if (selectedId) {
      if (dirty) {
        await updateResume(selectedId, { name, content });
        setDirty(false);
        qc.invalidateQueries({ queryKey: ["resumes"] });
      }
      return selectedId;
    }
    const created = await createResume({ name: name || "My Resume", content, is_primary: true });
    setSelectedId(created.id);
    setLoadedId(created.id);
    setDirty(false);
    qc.invalidateQueries({ queryKey: ["resumes"] });
    return created.id;
  };

  const saveMutation = useMutation({ mutationFn: ensureSaved });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const id = await ensureSaved();
      return reviewResume({ resume_id: id, job_description: jd, role_title: role });
    },
    onSuccess: (r) => {
      setReview(r);
      qc.invalidateQueries({ queryKey: ["resume-reviews"] });
    },
  });

  const tailorMutation = useMutation({
    mutationFn: () => tailorReview(review!.id),
    onSuccess: (r) => setReview(r),
  });

  const newResume = async () => {
    const created = await createResume({
      name: `Resume ${(resumes?.length ?? 0) + 1}`,
      content: DEFAULT_LATEX_RESUME,
      is_primary: !(resumes?.length),
    });
    qc.invalidateQueries({ queryKey: ["resumes"] });
    setSelectedId(created.id);
    setLoadedId(null);
  };

  const removeResume = async () => {
    if (!selectedId) return;
    await deleteResume(selectedId);
    qc.invalidateQueries({ queryKey: ["resumes"] });
    setSelectedId(null);
    setLoadedId(null);
    setContent("");
  };

  const makePrimary = async () => {
    if (!selectedId) return;
    await updateResume(selectedId, { is_primary: true });
    qc.invalidateQueries({ queryKey: ["resumes"] });
  };

  // Open the current .tex straight into a compiled Overleaf project (no in-app
  // compiler needed) — Overleaf accepts the source via a POST to /docs.
  const openInOverleaf = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.overleaf.com/docs";
    form.target = "_blank";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "snip";
    input.value = content;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const download = () => {
    const blob = new Blob([content], { type: "text/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name || "resume").replace(/\s+/g, "_")}.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadReview = async (id: string) => setReview(await getReview(id));

  const fb = review?.feedback;
  const resumeOptions = useMemo(
    () => (resumes ?? []).map((r) => ({ value: r.id, label: r.is_primary ? `★ ${r.name}` : r.name })),
    [resumes]
  );

  return (
    <Box p="md" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--app-bg)" }}>
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Badge size="lg" variant="light" color="grape">Resume Workspace</Badge>
          <Text size="sm" c="dimmed" visibleFrom="sm">Tailor your resume to each job — analysis, gaps, and rewrites.</Text>
        </Group>
      </Group>

      <Box style={{ flex: 1, minHeight: 0, display: "flex", gap: "1rem", flexDirection: "row" }}>
        {/* Editor */}
        <Box style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", border: "1px solid var(--app-line)", borderRadius: "var(--mantine-radius-lg)", background: "var(--app-surface)", overflow: "hidden" }}>
          <Group justify="space-between" p="xs" gap="xs" style={{ borderBottom: "1px solid var(--app-line)", flexShrink: 0 }} wrap="nowrap">
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
              <Select size="xs" placeholder="No resume yet" data={resumeOptions} value={selectedId}
                onChange={(v) => setSelectedId(v)} allowDeselect={false} style={{ maxWidth: 220 }} searchable />
              <Tooltip label="New resume from template"><ActionIcon variant="light" onClick={newResume}><FaPlus size={12} /></ActionIcon></Tooltip>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Button size="compact-sm" leftSection={<FaSave size={11} />} loading={saveMutation.isPending}
                disabled={!dirty && !!selectedId} onClick={() => saveMutation.mutate()}>
                {dirty || !selectedId ? "Save" : "Saved"}
              </Button>
              <Button size="compact-sm" variant="light" color="teal" leftSection={<FaExternalLinkAlt size={10} />}
                disabled={!content.trim()} onClick={openInOverleaf}>
                Preview
              </Button>
              <CopyBtn value={content} label=".tex" />
              <Tooltip label="Download .tex"><ActionIcon variant="light" onClick={download} disabled={!content}><FaDownload size={12} /></ActionIcon></Tooltip>
              <Menu position="bottom-end" shadow="md">
                <Menu.Target><ActionIcon variant="subtle" color="gray"><FaEllipsisV size={12} /></ActionIcon></Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<FaStar size={11} />} onClick={makePrimary} disabled={!selectedId}>Make primary</Menu.Item>
                  <Menu.Item leftSection={<FaTrash size={11} />} color="red" onClick={removeResume} disabled={!selectedId}>Delete</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
          <TextInput size="xs" variant="unstyled" value={name} placeholder="Resume name"
            onChange={(e) => { setName(e.currentTarget.value); setDirty(true); }}
            styles={{ input: { paddingLeft: 12, fontWeight: 600 } }} style={{ borderBottom: "1px solid var(--app-line)", flexShrink: 0 }} />
          <Box style={{ flex: 1, minHeight: 0 }}>
            {selectedId || content ? (
              <Editor height="100%" language="plaintext" theme={colorScheme === "dark" ? "vs-dark" : "vs-light"}
                value={content} onChange={(v) => { setContent(v ?? ""); setDirty(true); }}
                options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", scrollBeyondLastLine: false }} />
            ) : (
              <Stack align="center" justify="center" style={{ height: "100%" }} gap="sm" p="lg">
                <Text c="dimmed" ta="center">No resume yet. Start from a clean LaTeX template.</Text>
                <Button leftSection={<FaPlus size={12} />} onClick={newResume}>New resume</Button>
              </Stack>
            )}
          </Box>
          <Text size="xs" c="dimmed" p={6} style={{ borderTop: "1px solid var(--app-line)", flexShrink: 0 }}>
            Edit the LaTeX here → hit <b>Preview</b> to open it compiled in Overleaf (a new tab). The AI never changes your file — it suggests.
          </Text>
        </Box>

        {/* Tailor panel */}
        <Box style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", border: "1px solid var(--app-line)", borderRadius: "var(--mantine-radius-lg)", background: "var(--app-surface)", overflow: "hidden" }}>
          <ScrollArea style={{ flex: 1 }} p="md">
            <Stack gap="md">
              <Box>
                <Text fw={700} mb={4}>Tailor to a job</Text>
                <Text size="xs" c="dimmed" mb="xs">Paste the job description; get an ATS-style match score, keyword gaps, and rewrites.</Text>
                <TextInput size="xs" placeholder="Role / company (optional)" value={role} mb="xs"
                  onChange={(e) => setRole(e.currentTarget.value)} />
                <Textarea placeholder="Paste the full job description here..." value={jd}
                  onChange={(e) => setJd(e.currentTarget.value)} autosize minRows={4} maxRows={10} />
                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed">{jd.trim().length} chars</Text>
                  <Button leftSection={<FaSearch size={11} />} loading={analyzeMutation.isPending}
                    disabled={!jd.trim() || (!content.trim())} onClick={() => analyzeMutation.mutate()}>
                    Analyze
                  </Button>
                </Group>
                {analyzeMutation.isError && <Alert color="red" mt="xs" p="xs">Couldn't analyze. Add resume content and a JD, then retry.</Alert>}
              </Box>

              {fb && (
                <>
                  <Divider />
                  <Group align="center" gap="lg" wrap="nowrap">
                    <RingProgress size={92} thickness={9} roundCaps
                      sections={[{ value: fb.match_score, color: scoreColor(fb.match_score) }]}
                      label={<Text ta="center" fw={700} size="lg">{fb.match_score}</Text>} />
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: 0.5 }}>Match score</Text>
                      <Text size="sm" style={{ lineHeight: 1.5 }}>{fb.summary}</Text>
                    </Box>
                  </Group>

                  {fb.missing_keywords.length > 0 && (
                    <Box>
                      <Text size="xs" fw={700} c="red" tt="uppercase" mb={6} style={{ letterSpacing: 0.5 }}>Missing keywords</Text>
                      <KeywordChips items={fb.missing_keywords} color="red" />
                    </Box>
                  )}
                  {fb.matched_keywords.length > 0 && (
                    <Box>
                      <Text size="xs" fw={700} c="teal" tt="uppercase" mb={6} style={{ letterSpacing: 0.5 }}>You already have</Text>
                      <KeywordChips items={fb.matched_keywords} color="teal" />
                    </Box>
                  )}

                  <Group align="flex-start" grow>
                    {fb.strengths.length > 0 && (
                      <Box>
                        <Text size="xs" fw={700} c="teal" tt="uppercase" mb={4} style={{ letterSpacing: 0.5 }}>Strengths</Text>
                        <Stack gap={4}>{fb.strengths.map((s, i) => <Text key={i} size="sm">• {s}</Text>)}</Stack>
                      </Box>
                    )}
                    {fb.gaps.length > 0 && (
                      <Box>
                        <Text size="xs" fw={700} c="orange" tt="uppercase" mb={4} style={{ letterSpacing: 0.5 }}>Gaps</Text>
                        <Stack gap={4}>{fb.gaps.map((s, i) => <Text key={i} size="sm">• {s}</Text>)}</Stack>
                      </Box>
                    )}
                  </Group>

                  {fb.bullet_rewrites.length > 0 && (
                    <Box>
                      <Text size="xs" fw={700} tt="uppercase" mb={6} style={{ letterSpacing: 0.5 }}>Bullet rewrites</Text>
                      <Stack gap="xs">
                        {fb.bullet_rewrites.map((b, i) => (
                          <Card key={i} withBorder p="xs" radius="sm">
                            {b.before && <Text size="xs" c="dimmed" style={{ textDecoration: "line-through" }} mb={4}>{b.before}</Text>}
                            <Text size="sm">{b.after}</Text>
                            <Group justify="flex-end" mt={4}><CopyBtn value={b.after} /></Group>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {fb.tailoring_tips.length > 0 && (
                    <Box>
                      <Text size="xs" fw={700} tt="uppercase" mb={4} style={{ letterSpacing: 0.5 }}>Tips</Text>
                      <Stack gap={4}>{fb.tailoring_tips.map((s, i) => <Text key={i} size="sm">• {s}</Text>)}</Stack>
                    </Box>
                  )}

                  <Divider label="Tailored swap-in pieces" labelPosition="center" />
                  {review?.tailored ? (
                    <Stack gap="sm">
                      {review.tailored.summary && (
                        <Card withBorder p="xs" radius="sm">
                          <Group justify="space-between" mb={4}><Text size="xs" fw={700} c="dimmed">SUMMARY</Text><CopyBtn value={review.tailored.summary} /></Group>
                          <Text size="sm">{review.tailored.summary}</Text>
                        </Card>
                      )}
                      {review.tailored.skills && (
                        <Card withBorder p="xs" radius="sm">
                          <Group justify="space-between" mb={4}><Text size="xs" fw={700} c="dimmed">SKILLS</Text><CopyBtn value={review.tailored.skills} /></Group>
                          <Text size="sm">{review.tailored.skills}</Text>
                        </Card>
                      )}
                      {review.tailored.bullets.map((b, i) => (
                        <Card key={i} withBorder p="xs" radius="sm">
                          <Group justify="space-between" mb={4}><Text size="xs" fw={700} c="dimmed">{b.context || "BULLET"}</Text><CopyBtn value={b.text} /></Group>
                          <Text size="sm">{b.text}</Text>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Button variant="light" color="grape" leftSection={<FaMagic size={12} />}
                      loading={tailorMutation.isPending} onClick={() => tailorMutation.mutate()}>
                      Generate tailored summary, skills & bullets
                    </Button>
                  )}
                </>
              )}

              {!fb && reviews && reviews.length > 0 && (
                <>
                  <Divider label={<Group gap={4}><FaHistory size={10} /> Past analyses</Group>} labelPosition="center" />
                  <Stack gap={6}>
                    {reviews.map((r) => (
                      <Card key={r.id} withBorder p="xs" radius="sm" style={{ cursor: "pointer" }} onClick={() => loadReview(r.id)}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text size="sm" truncate>{r.role_title}</Text>
                          <Badge variant="light" color={scoreColor(r.match_score)}>{r.match_score}</Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </ScrollArea>
          {(analyzeMutation.isPending || tailorMutation.isPending) && (
            <Group gap="xs" p="xs" justify="center" style={{ borderTop: "1px solid var(--app-line)" }}>
              <Loader size="xs" /><Text size="xs" c="dimmed">{tailorMutation.isPending ? "Tailoring..." : "Analyzing against the JD..."}</Text>
            </Group>
          )}
        </Box>
      </Box>
    </Box>
  );
};
