import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  MarkerType,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Box, Group, Text, Anchor } from "@mantine/core";
import { RiExpandLeftLine } from "react-icons/ri";
import type { ReactFlowDiagram } from "../types/ai_core/api_types";
import { sdNodeTypes } from "./SystemDesignNodes";

interface Props {
  diagram: ReactFlowDiagram;
  onExpand?: () => void;
}

export const SystemDesignDiagram = ({ diagram, onExpand }: Props) => {
  const nodes = useMemo<Node[]>(
    () =>
      (diagram?.nodes ?? []).map((n) => ({
        id: n.id,
        type: "sd",
        position: n.position,
        data: { label: n.data?.label ?? "", kind: n.kind },
      })),
    [diagram]
  );

  const edges = useMemo<Edge[]>(
    () =>
      (diagram?.edges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    [diagram]
  );

  return (
    <Box
      style={{
        border: "1px solid #dee2e6",
        borderRadius: 8,
        overflow: "hidden",
        marginTop: 8,
      }}
    >
      <Group justify="space-between" p={6} style={{ borderBottom: "1px solid var(--app-line)" }}>
        <Text size="xs" fw={600} c="dimmed" m={0}>
          Architecture diagram
        </Text>
        {onExpand && (
          <Anchor onClick={onExpand} size="xs" style={{ cursor: "pointer" }}>
            <RiExpandLeftLine size={14} style={{ verticalAlign: "middle" }} /> Show in editor
          </Anchor>
        )}
      </Group>
      <Box style={{ width: "100%", height: 260 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={sdNodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnDoubleClick={false}
          style={{ width: "100%", height: "100%" }}
        >
          <Background gap={20} />
        </ReactFlow>
      </Box>
    </Box>
  );
};