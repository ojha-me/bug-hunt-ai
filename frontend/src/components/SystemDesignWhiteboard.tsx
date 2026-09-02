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
import { Button, Group, Text, Box, ActionIcon, Tooltip } from "@mantine/core";
import {
  RiGlobalLine,
  RiSmartphoneLine,
  RiDashboardLine,
  RiServerLine,
  RiStackLine,
  RiExchangeLine,
  RiDatabaseLine,
  RiCloudLine,
  RiSendPlaneLine,
  RiDeleteBin6Line,
} from "react-icons/ri";
import type { ComponentType, ReactFlowDiagram } from "../types/ai_core/api_types";

export interface PaletteEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  nodeType?: "input" | "output" | "default";
}

export const COMPONENT_PALETTE: PaletteEntry[] = [
  { key: "client_web", label: "Web Client", icon: <RiGlobalLine />, color: "#4c6ef5", nodeType: "input" },
  { key: "client_mobile", label: "Mobile Client", icon: <RiSmartphoneLine />, color: "#6741d9", nodeType: "input" },
  { key: "load_balancer", label: "Load Balancer", icon: <RiDashboardLine />, color: "#0ca678" },
  { key: "servers", label: "Servers", icon: <RiServerLine />, color: "#1971c2" },
  { key: "cache", label: "Cache", icon: <RiStackLine />, color: "#f59f00" },
  { key: "queue", label: "Message Queue", icon: <RiExchangeLine />, color: "#e8590c" },
  { key: "database", label: "Database", icon: <RiDatabaseLine />, color: "#f76707", nodeType: "output" },
  { key: "blob", label: "Blob / CDN", icon: <RiCloudLine />, color: "#12b886", nodeType: "output" },
];

let nodeCounter = 0;

const initialNodes: Node[] = [
  {
    id: `n-sd-${nodeCounter+1}`,
    type: "input",
    position: { x: 0, y: 200 },
    data: { label: "Web Client" },
    style: { width: 168, borderRadius: 10, border: `2px solid #4c6ef5`, background: "#e7f5ff", color: "#1c1f2e", fontSize: 13 },
  },
];

interface Props {
  onSubmit?: (diagram: ReactFlowDiagram) => void;
  loadedDiagram?: ReactFlowDiagram | null;
}

export const SystemDesignWhiteboard = ({ onSubmit, loadedDiagram }: Props) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!loadedDiagram) return;
    const rfNodes: Node[] = (loadedDiagram.nodes ?? []).map((n: any) => ({
      id: n.id,
      type: n.type === "input" || n.type === "output" ? n.type : "default",
      position: n.position,
      data: { label: n.data?.label ?? "" },
      style: { width: 168, borderRadius: 10, border: `2px solid #868e96`, background: "#fff", color: "#1c1f2e", fontSize: 13 },
    }));
    const rfEdges: Edge[] = (loadedDiagram.edges ?? []).map((e: any) => ({
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

  const addNode = (entry: PaletteEntry) => {
    nodeCounter += 1;
    const newNode: Node = {
      id: `n-sd-${Date.now()}`,
      type: entry.nodeType ?? "default",
      position: { x: 300 + (nodeCounter % 3) * 240, y: 40 + Math.floor(nodeCounter / 3) * 170 },
      data: { label: entry.label },
      style: {
        width: 168,
        borderRadius: 10,
        border: `2px solid ${entry.color}`,
        background: "#ffffff",
        color: "#1c1f2e",
        fontSize: 13,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDiagram = (): ReactFlowDiagram => {
    const sdNodes: NonNullable<ReactFlowDiagram["nodes"]> = nodes.map((n: any) => ({
      id: n.id,
      type: (n.type === "input" || n.type === "output" ? n.type : "default") as ComponentType,
      position: n.position,
      data: { label: String(n.data?.label ?? "") },
    }));
    const sdEdges: NonNullable<ReactFlowDiagram["edges"]> = edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ?? "",
    }));
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
    const label = window.prompt("Rename component:", String(node.data?.label ?? ""));
    if (label) {
      setNodes((nds) =>
        nds.map((n) => (n.id === node.id ? { ...n, data: { ...n.data, label } } : n))
      );
    }
  };

  const onNodeClick = (_ev: React.MouseEvent, node: Node) => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
  };

  return (
    <Box style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      <Group gap={6} p="xs" style={{ borderBottom: "1px solid #e9ecef", flexShrink: 0, overflowX: "auto", flexWrap: "nowrap" }}>
        {COMPONENT_PALETTE.map((entry) => (
          <Tooltip key={entry.key} label={`Add ${entry.label}`} position="bottom">
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeClick={onNodeClick}
          fitView
          style={{ width: "100%", height: "100%" }}
        >
          <Background gap={20} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Box>
      <Text size="xs" c="dimmed" style={{ position: "absolute", bottom: 6, right: 10, background: "rgba(255,255,255,0.85)", borderRadius: 4, padding: "2px 6px" }}>
        Drag to connect • double-click a box to rename it
      </Text>
    </Box>
  );
};