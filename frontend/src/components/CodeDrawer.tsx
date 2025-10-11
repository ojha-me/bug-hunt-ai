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
  executionOutput: string;
  isExecuting: boolean;
  onRunCode: (code: string, language: string) => void;
  onSubmitCode: (code: string, language: string, message?: string) => void;
  messageId?: string;
}

export const CodeDrawer = ({
  isOpen,
  onClose,
  code,
  language,
  executionOutput,
  isExecuting,
  onRunCode,
  onSubmitCode,
  messageId,
}: CodeDrawerProps) => {
  const theme = useMantineTheme();
  const [currentCode, setCurrentCode] = useState(code);
  const [currentOutput, setCurrentOutput] = useState(executionOutput);
  const [message, setMessage] = useState("");

  // Initialize code from session storage or props when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    if (messageId) {
      const storedCodeObject = sessionStorage.getItem("codeStorage");
      if (storedCodeObject) {
        try {
          const codeStorage = JSON.parse(storedCodeObject);
          if (codeStorage[messageId]) {
            setCurrentCode(codeStorage[messageId]);
            return;
          }
        } catch (e) {
          console.error("Error parsing code storage", e);
        }
      }
    }
    setCurrentCode(code);
  }, [isOpen, code, messageId]);

  const handleCodeChange = (value: string) => {
    setCurrentCode(value || "");
    if (!messageId) return;
    try {
      const storedCodeObject = sessionStorage.getItem("codeStorage");
      const codeStorage = storedCodeObject ? JSON.parse(storedCodeObject) : {};
      codeStorage[messageId] = value || "";
      sessionStorage.setItem("codeStorage", JSON.stringify(codeStorage));
    } catch (e) {
      console.error("Error storing code", e);
    }
  };

  const handleReset = () => {
    const storedCodeObject = sessionStorage.getItem("codeStorage");
    if (storedCodeObject) {
      try {
        const codeStorage = JSON.parse(storedCodeObject);
        if (messageId) {
          delete codeStorage[messageId];
          sessionStorage.setItem("codeStorage", JSON.stringify(codeStorage));
        } else {
          sessionStorage.removeItem("codeStorage");
        }
      } catch (e) {
        console.error("Error parsing code storage", e);
        sessionStorage.removeItem("codeStorage");
      }
    }
    setCurrentCode(code);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentOutput(executionOutput);
    }
  }, [isOpen, executionOutput]);

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
            onChange={(value) => handleCodeChange(value || "")}
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
            <Button
              onClick={handleReset}
              variant="outline"
            >
              Reset Code
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