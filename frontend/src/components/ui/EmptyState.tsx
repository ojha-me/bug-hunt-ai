import { Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  iconColor?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, iconColor, title, description, action }: EmptyStateProps) => (
  <Stack align="center" justify="center" py="xl" gap="xs">
    {icon && (
      <ThemeIcon size={48} radius="xl" variant="light" color={iconColor}>
        {icon}
      </ThemeIcon>
    )}
    <Text fw={600} ta="center">
      {title}
    </Text>
    {description && (
      <Text size="sm" c="dimmed" ta="center" style={{ maxWidth: 340 }}>
        {description}
      </Text>
    )}
    {action}
  </Stack>
);