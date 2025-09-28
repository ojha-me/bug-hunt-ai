import {
  Drawer,
  Button,
  Box,
  Group,
  Loader,
  ScrollArea,
  Text,
  useMantineTheme,
  TextInput,
} from "@mantine/core";
import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  messageId: string;
  executionOutput: string;
  isExecuting: boolean;
  onRunCode: (code: string, language: string) => void;
  onSubmitCode: (code: string, language: string, message?: string) => void;
}

export const CodeDrawer = ({
  isOpen,
  onClose,
  code,
  language,
  messageId,
  executionOutput,
  isExecuting,
  onRunCode,
  onSubmitCode,
}: CodeDrawerProps) => {
  const theme = useMantineTheme();
  const [currentCode, setCurrentCode] = useState(code);
  const [currentOutput, setCurrentOutput] = useState(executionOutput);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      // When drawer opens, try to restore saved code and output for this specific message
      const storageKey = `codeExecution_${messageId}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Only restore if it's recent (less than 1 hour old)
          if (Date.now() - parsed.timestamp < 3600000) {
            setCurrentCode(parsed.code || code);
            if (parsed.output || parsed.error) {
              setCurrentOutput(parsed.output || `Error: ${parsed.error}`);
            }
          } else {
            // Use passed props if saved data is too old
            setCurrentCode(code);
            setCurrentOutput(executionOutput);
          }
        } catch {
          // Use passed props if parsing fails
          setCurrentCode(code);
          setCurrentOutput(executionOutput);
        }
      } else {
        // Use passed props if no saved data
        setCurrentCode(code);
        setCurrentOutput(executionOutput);
      }
    }
  }, [isOpen, code, executionOutput, messageId]);

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title="Code Editor & Console"
      position="right"
      size="75%"
      styles={{
        body: { height: "calc(100% - 60px)", padding: 0 },
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box style={{ flex: 3, minHeight: 0 }}>
          <Editor
            height="100%"
            language={language}
            value={currentCode}
            onChange={(value) => setCurrentCode(value || "")}
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
        </Box>

        <Box p="md" style={{ borderTop: `1px solid ${theme.colors.gray[2]}`, borderBottom: `1px solid ${theme.colors.gray[2]}` }}>
          <TextInput
            placeholder="Optional message to send with your code..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            mb="sm"
          />
          <Group>
            <Button
              onClick={() => onRunCode(currentCode, language)}
              loading={isExecuting}
            >
              Run Code
            </Button>
            <Button
              onClick={() => onSubmitCode(currentCode, language, message)}
              loading={isExecuting}
            >
              Submit Code
            </Button>
          </Group>
        </Box>

        <Box
          style={{
            flex: 2,
            minHeight: 0,
            background: "#1e1e1e",
            color: "#d4d4d4",
            fontFamily: "monospace",
            display: 'flex',
            flexDirection: 'column'
          }}
          p="md"
        >
          <Text size="sm" c="dimmed" mb="xs">
            Console
          </Text>
          <ScrollArea style={{ flex: 1 }}>
            {isExecuting ? (
              <Group>
                <Loader color="white" size="sm" />
                <Text size="sm">Executing...</Text>
              </Group>
            ) : (
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: '14px' }}>
                {currentOutput || "Output will appear here..."}
              </pre>
            )}
          </ScrollArea>
        </Box>
      </Box>
    </Drawer>
  );
};