"use client";

import type { CSSProperties } from "react";

const PALETTES = [
  ["#f4c430", "#13293d"], ["#d9363e", "#f4efe1"], ["#1c78c0", "#f4efe1"],
  ["#14805e", "#f4c430"], ["#602d91", "#f4efe1"], ["#f07f24", "#18222c"],
  ["#f4efe1", "#20242a"], ["#9b1c31", "#e8c55b"],
];
const SHAPES = ["shield", "roundel", "diamond", "pennant", "hexagon"];

function hashName(value: string) {
  let hash = 2166136261;
  for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function initials(name: string) {
  return name.split(" ").filter((part) => part && !/^(KS|LKS|MKS|GKS|UKS|KP|LZS)$/i.test(part)).map((part) => part[0]).join("").slice(0, 3).toUpperCase() || "KS";
}

export function ClubCrest({ name, size = "normal", muted = false }: { name: string; size?: "tiny" | "normal" | "large"; muted?: boolean }) {
  const hash = hashName(name || "Klub");
  const palette = PALETTES[hash % PALETTES.length];
  const style = { "--crest-primary": muted ? "#9aa6ad" : palette[0], "--crest-secondary": muted ? "#26323b" : palette[1] } as CSSProperties;
  return <span className={`club-mark ${size}`} aria-hidden="true"><span className={`club-mark-core ${SHAPES[(hash >>> 4) % SHAPES.length]}`} style={style}><b>{initials(name)}</b><i /></span></span>;
}
