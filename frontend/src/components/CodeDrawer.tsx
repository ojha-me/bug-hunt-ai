import {
    Drawer,
    Button,
    Box,
    Group,
    Loader,
    ScrollArea,
    Text,
    useMantineTheme,
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
  }
  
  export const CodeDrawer = ({
    isOpen,
    onClose,
    code,
    language,
    executionOutput,
    isExecuting,
    onRunCode,
  }: CodeDrawerProps) => {
    const theme = useMantineTheme();
    const [currentCode, setCurrentCode] = useState(code);

    
  
    useEffect(() => {
      setCurrentCode(code);
    }, [code, isOpen]); 
  

    
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
  
          <Group p="md" style={{ borderTop: `1px solid ${theme.colors.gray[2]}`, borderBottom: `1px solid ${theme.colors.gray[2]}` }}>
            <Button
              onClick={() => onRunCode(currentCode, language)}
              loading={isExecuting}
            >
              Run Code
            </Button>
          </Group>
  
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
                  {executionOutput || "Output will appear here..."}
                </pre>
              )}
            </ScrollArea>
          </Box>
        </Box>
      </Drawer>
    );
  };