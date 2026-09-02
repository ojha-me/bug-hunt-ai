import { Box, Group, Text, Badge } from "@mantine/core";
import type { ReactNode } from "react";

export const Page = ({ children }: { children: ReactNode }) => (
  <Box
    p={{ base: "md", md: "lg" }}
    style={{ height: "100vh", overflowY: "auto", background: "var(--app-bg)" }}
  >
    {children}
  </Box>
);

interface PageHeaderProps {
  icon?: ReactNode;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export const PageHeader = ({ icon, iconColor = "indigo", title, subtitle, right }: PageHeaderProps) => (
  <Group mb="lg" justify="space-between" wrap="wrap" gap="sm">
    <Group gap="sm" wrap="nowrap">
      {icon && (
        <Badge size="lg" variant="light" color={iconColor} p="xs" radius="md">
          {icon}
        </Badge>
      )}
      <Box>
        <Text size="xl" fw={700} lh={1.2}>
          {title}
        </Text>
        {subtitle && (
          <Text size="sm" c="dimmed" mt={2}>
            {subtitle}
          </Text>
        )}
      </Box>
    </Group>
    {right}
  </Group>
);