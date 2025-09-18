import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";

interface CodeSnippetProps {
  code: string;
  readOnly?: boolean;
  language?: string; // optional, default to "javascript"
  onChange?: (newCode: string) => void;
  height?: string; // optional, default height
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({
  code,
  readOnly = true,
  language = "javascript",
  onChange,
  height = "200px",
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange = (value: string | undefined) => {
    if (value && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <Editor
        height={height}
        defaultLanguage={language}
        defaultValue={code}
        value={code}
        onMount={handleEditorDidMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default CodeSnippet;
