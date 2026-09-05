import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button, Group, Text, Box, ActionIcon, Tooltip, useMantineColorScheme, Modal, TextInput } from "@mantine/core";
import { RiSendPlaneLine, RiDeleteBin6Line } from "react-icons/ri";
import { useState } from "react";
import type { ComponentType, NodeKind, ReactFlowDiagram } from "../types/ai_core/api_types";
import { KIND_META, PALETTE_KINDS, sdNodeTypes } from "./SystemDesignNodes";

type FlowNode = ReactFlowDiagram["nodes"][number];
type FlowEdge = ReactFlowDiagram["edges"][number];

const COMPONENT_PALETTE = PALETTE_KINDS.map((kind) => ({
  kind,
  label: KIND_META[kind].label,
  icon: KIND_META[kind].icon,
  color: KIND_META[kind].color,
}));

let nodeCounter = 0;

const initialNodes: Node[] = [
  {
    id: `n-sd-${nodeCounter + 1}`,
    type: "sd",
    position: { x: 0, y: 200 },
    data: { label: "Web Client", kind: "client" as NodeKind },
  },
];

interface Props {
  onSubmit?: (diagram: ReactFlowDiagram) => void;
  loadedDiagram?: ReactFlowDiagram | null;
}

export const SystemDesignWhiteboard = ({ onSubmit, loadedDiagram }: Props) => {
  const { colorScheme } = useMantineColorScheme();
  const flowColorMode = colorScheme === "dark" ? "dark" : "light";
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [renamingNode, setRenamingNode] = useState<Node | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (!loadedDiagram) return;
    const rfNodes: Node[] = (loadedDiagram.nodes ?? []).map((n: FlowNode): Node => ({
      id: n.id,
      type: "sd",
      position: n.position,
      data: { label: n.data?.label ?? "", kind: n.kind },
    }));
    const rfEdges: Edge[] = (loadedDiagram.edges ?? []).map((e: FlowEdge): Edge => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      markerEnd: { type: MarkerType.ArrowClosed },
    }));
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [loadedDiagram, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e${Date.now()}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = (entry: (typeof COMPONENT_PALETTE)[number]) => {
    nodeCounter += 1;
    const newNode: Node = {
      id: `n-sd-${Date.now()}`,
      type: "sd",
      position: { x: 300 + (nodeCounter % 3) * 240, y: 40 + Math.floor(nodeCounter / 3) * 170 },
      data: { label: entry.label, kind: entry.kind },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDiagram = (): ReactFlowDiagram => {
    const sdNodes: NonNullable<ReactFlowDiagram["nodes"]> = nodes.map(
      (n): FlowNode => ({
        id: n.id,
        type: "default" as ComponentType,
        kind: n.data?.kind as NodeKind | undefined,
        position: n.position,
        data: { label: String(n.data?.label ?? "") },
      })
    );
    const sdEdges: NonNullable<ReactFlowDiagram["edges"]> = edges.map(
      (e): FlowEdge => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label != null ? String(e.label) : undefined,
      })
    );
    return { nodes: sdNodes, edges: sdEdges };
  };

  const handleSubmit = () => {
    const diagram = getDiagram();
    if (diagram.nodes.length === 0) return;
    onSubmit?.(diagram);
  };

  const handleClear = () => {
    setEdges([]);
    setNodes(initialNodes);
  };

  const onNodeDoubleClick = (_ev: React.MouseEvent, node: Node) => {
    setRenamingNode(node);
    setRenameValue(String(node.data?.label ?? ""));
  };
  const handleRenameSave = () => {
    if (!renamingNode) return;
    const label = renameValue.trim();
    if (label) {
      setNodes((nds) =>
        nds.map((n) => (n.id === renamingNode.id ? { ...n, data: { ...n.data, label } } : n))
      );
    }
    setRenamingNode(null);
  };

  const onNodeClick = (_ev: React.MouseEvent, node: Node) => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
  };

  return (
    <Box style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <Group gap={6} p="xs" style={{ borderBottom: "1px solid var(--app-line)", flexShrink: 0, overflowX: "auto", flexWrap: "nowrap" }}>
        {COMPONENT_PALETTE.map((entry) => (
          <Tooltip key={entry.kind} label={`Add ${entry.label}`} position="bottom">
            <ActionIcon
              variant="light"
              color={entry.color}
              size="md"
              onClick={() => addNode(entry)}
              style={{ flexShrink: 0 }}
            >
              {entry.icon}
            </ActionIcon>
          </Tooltip>
        ))}
        <Box style={{ flex: 1 }} />
        {onSubmit && (
          <Button size="compact-xs" variant="filled" color="green" leftSection={<RiSendPlaneLine size={14} />} onClick={handleSubmit} style={{ flexShrink: 0 }}>
            Ask AI to review
          </Button>
        )}
        <Button size="compact-xs" variant="subtle" color="gray" leftSection={<RiDeleteBin6Line size={14} />} onClick={handleClear} style={{ flexShrink: 0 }}>
          Clear
        </Button>
      </Group>
      <Box style={{ flex: 1, minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={sdNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeClick={onNodeClick}
          fitView
          colorMode={flowColorMode}
          style={{ width: "100%", height: "100%" }}
        >
          <Background gap={20} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Box>
      <Text
        size="xs"
        c="dimmed"
        style={{
          position: "absolute",
          bottom: 6,
          right: 10,
          background: colorScheme === "dark" ? "rgba(24,24,37,0.85)" : "rgba(255,255,255,0.85)",
          borderRadius: 4,
          padding: "2px 6px",
        }}
      >
        Drag to connect • double-click a box to rename it
        </Text>
        <Modal opened={!!renamingNode} onClose={() => setRenamingNode(null)} title="Rename component" centered>
          <TextInput value={renameValue} onChange={(e) => setRenameValue(e.target.value)} data-autofocus />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setRenamingNode(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSave} disabled={!renameValue.trim()}>
              Save
            </Button>
          </Group>
        </Modal>
     </Box>
   );
};