import { createTheme } from "@mantine/core";

export const brandGradient = "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)";

const fontStack =
  '"Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const monoStack =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

// Cool slate-neutral scale (replaces Mantine's warm default gray).
const neutral: [string, string, string, string, string, string, string, string, string, string] = [
  "#f8fafc",
  "#f1f5f9",
  "#e2e8f0",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
];

export const shadowTokens = {
  xs: "0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.08)",
  sm: "0 2px 4px rgba(15, 23, 42, 0.05), 0 4px 12px rgba(15, 23, 42, 0.07)",
  md: "0 4px 8px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.1)",
  lg: "0 8px 16px rgba(15, 23, 42, 0.08), 0 16px 48px rgba(15, 23, 42, 0.12)",
  xl: "0 12px 24px rgba(15, 23, 42, 0.1), 0 28px 64px rgba(15, 23, 42, 0.16)",
} as const;

// Desaturated teal scale (Mantine order: 0 lightest -> 9 darkest).
export const teal: [string, string, string, string, string, string, string, string, string, string] = [
  "#e6fffa",
  "#ccfbf1",
  "#99f6e4",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#115e59",
  "#134e4a",
];

export const theme = createTheme({
  primaryColor: "teal",
  primaryShade: { light: 7, dark: 8 },
  defaultRadius: "md",
  fontFamily: fontStack,
  fontFamilyMonospace: monoStack,
  headings: {
    fontFamily: fontStack,
    fontWeight: "650",
  },
  colors: {
    gray: neutral,
    teal,
  },
  shadows: {
    xs: shadowTokens.xs,
    sm: shadowTokens.sm,
    md: shadowTokens.md,
    lg: shadowTokens.lg,
    xl: shadowTokens.xl,
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    ActionIcon: {
      defaultProps: {
        variant: "subtle",
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
        p: "lg",
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
      },
    },
    Tabs: {
      defaultProps: {
        variant: "outline",
      },
    },
  },
});