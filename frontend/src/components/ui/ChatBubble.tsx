import { Box } from "@mantine/core";
import type { CSSProperties, ReactNode } from "react";
import { bubbleSurface } from "./helpers";

interface ChatBubbleProps {
  sender: "user" | "ai";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const ChatBubble = ({ sender, children, className, style }: ChatBubbleProps) => (
  <Box p="sm" className={`app-bubble ${className ?? ""}`} style={{ ...bubbleSurface(sender), ...style }}>
    {children}
  </Box>
);