import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  FaLaptop,
  FaBalanceScale,
  FaDoorOpen,
  FaServer,
  FaCogs,
  FaDatabase,
  FaBolt,
  FaArchive,
  FaSearch,
  FaWarehouse,
  FaExchangeAlt,
  FaStream,
  FaGlobe,
  FaExternalLinkAlt,
} from "react-icons/fa";
import type { NodeKind } from "../types/ai_core/api_types";

type Shape = "rect" | "pill" | "hex" | "cylinder" | "stack";

interface KindMeta {
  label: string;
  color: string;
  icon: ReactNode;
  shape: Shape;
}

/**
 * The canonical system-design component vocabulary. Each entry drives how the
 * node is rendered (icon + accent colour + silhouette) so a database no longer
 * looks like a load balancer. Keep the keys in sync with the `NodeKind` union
 * and the prompt legends in the backend (system_design_ai.py / sd_prompts.py).
 */
export const KIND_META: Record<NodeKind, KindMeta> = {
  client: { label: "Client", color: "#4c6ef5", icon: <FaLaptop />, shape: "pill" },
  load_balancer: { label: "Load Balancer", color: "#0ca678", icon: <FaBalanceScale />, shape: "hex" },
  api_gateway: { label: "API Gateway", color: "#12b886", icon: <FaDoorOpen />, shape: "hex" },
  service: { label: "Service", color: "#7048e8", icon: <FaServer />, shape: "rect" },
  worker: { label: "Worker", color: "#9775fa", icon: <FaCogs />, shape: "rect" },
  database: { label: "Database", color: "#1971c2", icon: <FaDatabase />, shape: "cylinder" },
  cache: { label: "Cache", color: "#f59f00", icon: <FaBolt />, shape: "rect" },
  object_storage: { label: "Object Store", color: "#2f9e44", icon: <FaArchive />, shape: "cylinder" },
  search: { label: "Search", color: "#e8590c", icon: <FaSearch />, shape: "rect" },
  warehouse: { label: "Warehouse", color: "#1098ad", icon: <FaWarehouse />, shape: "rect" },
  queue: { label: "Queue", color: "#e64980", icon: <FaExchangeAlt />, shape: "stack" },
  stream: { label: "Stream", color: "#ae3ec9", icon: <FaStream />, shape: "stack" },
  cdn: { label: "CDN", color: "#15aabf", icon: <FaGlobe />, shape: "rect" },
  external: { label: "External", color: "#868e96", icon: <FaExternalLinkAlt />, shape: "rect" },
};

const DEFAULT_KIND: NodeKind = "service";

/** Ordered list used to build the whiteboard palette. */
export const PALETTE_KINDS: NodeKind[] = [
  "client",
  "cdn",
  "load_balancer",
  "api_gateway",
  "service",
  "worker",
  "cache",
  "database",
  "object_storage",
  "search",
  "queue",
  "stream",
  "external",
];

/** Coerce an unknown/legacy kind into a valid one so rendering never breaks. */
export const resolveKind = (kind?: string | null): NodeKind =>
  kind && kind in KIND_META ? (kind as NodeKind) : DEFAULT_KIND;

export interface KindNodeData {
  label: string;
  kind?: NodeKind;
  [key: string]: unknown;
}

const handleStyle = {
  width: 7,
  height: 7,
  background: "var(--app-line)",
  border: "1px solid var(--app-surface)",
};

const shapeStyle = (meta: KindMeta): React.CSSProperties => {
  switch (meta.shape) {
    case "pill":
      return { borderRadius: 999 };
    case "hex":
      return {
        clipPath: "polygon(14% 0, 86% 0, 100% 50%, 86% 100%, 14% 100%, 0 50%)",
        borderRadius: 4,
        paddingLeft: 22,
        paddingRight: 22,
      };
    case "cylinder":
      // Elliptical top & bottom edges read as a DB drum.
      return { borderRadius: "50% / 20px" };
    case "stack":
      // Offset shadows suggest a stack of partitions / messages.
      return {
        borderRadius: 8,
        boxShadow: `4px 4px 0 -1px ${meta.color}33, 8px 8px 0 -1px ${meta.color}22`,
      };
    default:
      return { borderRadius: 8 };
  }
};

/**
 * A single React Flow custom node keyed by semantic `kind`. Handles live on an
 * unclipped wrapper so hexagon/cylinder silhouettes never clip the edge anchors.
 */
export function KindNode({ data }: NodeProps) {
  const d = data as KindNodeData;
  const meta = KIND_META[resolveKind(d.kind)];
  const isExternal = resolveKind(d.kind) === "external";

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          minWidth: 128,
          maxWidth: 200,
          fontSize: 12.5,
          fontWeight: 600,
          lineHeight: 1.25,
          color: "var(--mantine-color-text)",
          background: `${meta.color}1f`,
          border: `1.5px ${isExternal ? "dashed" : "solid"} ${meta.color}`,
          boxSizing: "border-box",
          ...shapeStyle(meta),
        }}
      >
        <span style={{ color: meta.color, display: "inline-flex", fontSize: 14, flexShrink: 0 }}>
          {meta.icon}
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {d.label}
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

/** Stable module-level reference so React Flow doesn't warn on re-renders. */
export const sdNodeTypes = { sd: KindNode };
