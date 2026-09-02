import { Box, Text, Button, Group, Badge, Card, SimpleGrid, Progress } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FaProjectDiagram, FaPlay, FaArrowRight, FaBook } from "react-icons/fa";
import { getSDCourses, getUserSDCourses, enrollInSDCourse } from "../api/systemDesign";
import { createConversation } from "../api/conversation";
import { Page, PageHeader, GridSkeleton, EmptyState } from "./ui";

export const SDCoursesPage = () => {
  const navigate = useNavigate();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["sd-courses"],
    queryFn: getSDCourses,
  });

  const { data: userCourses, isLoading: userCoursesLoading } = useQuery({
    queryKey: ["sd-user-courses"],
    queryFn: getUserSDCourses,
  });

  const enrollMutation = useMutation({
    mutationFn: enrollInSDCourse,
    onSuccess: (enrolled) => {
      navigate(`/system-design/learn/${enrolled.course.id}`);
    },
  });

  const createPracticeRoomMutation = useMutation({
    mutationFn: () => createConversation("system_design"),
    onSuccess: (convo) => navigate(`/system-design/${convo.id}`),
  });

  const enrolledIdByCourse = new Map(
    (userCourses ?? []).map((uc) => [uc.course.id, uc])
  );

  if (isLoading || userCoursesLoading) {
    return (
      <Page>
        <GridSkeleton cards={3} withHeader />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        icon={<FaProjectDiagram size={14} />}
        iconColor="violet"
        title="Course Catalog"
        subtitle="Structured system design curriculum plus ad-hoc and case-study practice."
      />

      <Box mb="xl">
        <Text size="sm" c="dimmed" mb="xs" fw={600}>
          Practice Room
        </Text>
        <Card
          withBorder
          p="lg"
          className="app-hover-lift"
          style={{ cursor: "pointer" }}
          onClick={() => createPracticeRoomMutation.mutate()}
        >
          <Group justify="space-between" wrap="wrap">
            <Box style={{ maxWidth: 560 }}>
              <Text fw={600}>Ad-hoc Interview Practice</Text>
              <Text size="sm" c="dimmed" mt={4}>
                Skip the curriculum and get interviewed on a system you name, e.g. "Design Twitter". Includes a blank whiteboard.
              </Text>
            </Box>
            <Button
              variant="light"
              color="violet"
              loading={createPracticeRoomMutation.isPending}
              rightSection={<FaArrowRight size={12} />}
            >
              Let's talk
            </Button>
          </Group>
        </Card>
      </Box>

      <Box mb="xl">
        <Text size="sm" c="dimmed" mb="xs" fw={600}>
          Case Studies
        </Text>
        <Card
          withBorder
          p="lg"
          className="app-hover-lift"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/system-design/case-studies")}
        >
          <Group justify="space-between" wrap="wrap">
            <Box style={{ maxWidth: 560 }}>
              <Text fw={600}>Canonical Architecture Case Studies</Text>
              <Text size="sm" c="dimmed" mt={4}>
                URL shortener, rate limiter, news feed, chat, notifications — each with a reference diagram
                you can load straight into the whiteboard.
              </Text>
            </Box>
            <Button
              variant="light"
              color="grape"
              rightSection={<FaArrowRight size={12} />}
              leftSection={<FaBook size={12} />}
            >
              Browse
            </Button>
          </Group>
        </Card>
      </Box>

      <Text size="sm" c="dimmed" mb="xs" fw={600}>
        {userCourses?.length ? "Continue Learning" : "Structured Courses"}
      </Text>

      {courses?.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" className="app-stagger">
          {courses.map((course) => {
            const enrollment = enrolledIdByCourse.get(course.id);
            return (
              <Card key={course.id} withBorder p="lg" className="app-hover-lift" style={{ display: "flex", flexDirection: "column" }}>
                <Group justify="space-between" mb="sm">
                  <Badge variant="light" color="violet">
                    {course.lessons_count} lessons
                  </Badge>
                  {enrollment && (
                    <Badge variant="filled" color={enrollment.is_completed ? "green" : "blue"} size="xs">
                      {enrollment.is_completed ? "Completed" : `${Math.round(enrollment.progress_percentage)}%`}
                    </Badge>
                  )}
                </Group>
                <Text fw={600} size="md">
                  {course.name}
                </Text>
                <Text size="sm" c="dimmed" mt={4} lineClamp={3} style={{ flex: 1 }}>
                  {course.description}
                </Text>

                {enrollment && !enrollment.is_completed && (
                  <Progress value={enrollment.progress_percentage} size="xs" color="violet" mt="sm" mb="sm" />
                )}

                <Group mt="md">
                  <Button
                    fullWidth
                    variant={enrollment ? "light" : "filled"}
                    color="violet"
                    leftSection={<FaPlay size={12} />}
                    onClick={() => {
                      if (enrollment) {
                        navigate(`/system-design/learn/${course.id}`);
                      } else {
                        enrollMutation.mutate(course.id);
                      }
                    }}
                  >
                    {enrollment ? "Continue" : "Enroll"}
                  </Button>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      ) : (
        <EmptyState
          icon={<FaProjectDiagram />}
          iconColor="violet"
          title="No courses available yet."
        />
      )}
    </Page>
  );
};