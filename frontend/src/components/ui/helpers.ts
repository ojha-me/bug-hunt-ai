import type { CSSProperties } from "react";

export const bubbleSurface = (sender: "user" | "ai"): CSSProperties => ({
  backgroundColor: sender === "user" ? "var(--mantine-primary-color-light)" : "var(--app-sunken)",
});

export const difficultyColor = (d: string) =>
  d === "easy" ? "green" : d === "medium" ? "yellow" : "red";