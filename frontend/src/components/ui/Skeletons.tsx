import { SimpleGrid, Skeleton, Stack } from "@mantine/core";

export const GridSkeleton = ({
  cards = 6,
  height = 140,
  withHeader = false,
}: {
  cards?: number;
  height?: number;
  withHeader?: boolean;
}) => (
  <>
    {withHeader && (
      <Stack gap="sm" mb="lg">
        <Skeleton width={220} height={28} radius="md" />
        <Skeleton width={320} height={12} radius="md" />
      </Stack>
    )}
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" className="app-stagger">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} height={height} radius="lg" />
      ))}
    </SimpleGrid>
  </>
);

export const StatsSkeleton = () => (
  <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="md" mb="lg">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} height={92} radius="md" />
    ))}
  </SimpleGrid>
);

export const ChatSkeleton = () => (
  <Stack gap="sm" px="md">
    <Skeleton height={44} radius="md" w="42%" />
    <Skeleton height={64} radius="md" w="60%" ml="auto" />
    <Skeleton height={52} radius="md" w="52%" />
    <Skeleton height={72} radius="md" w="66%" ml="auto" />
    <Skeleton height={44} radius="md" w="40%" />
  </Stack>
);