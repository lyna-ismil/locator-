// filepath: c:\Users\Lina\Desktop\stage\locater\EV--hv\app\utils\normalizeConnector.ts
// Canonical connector normalization (must align with CONNECTOR_TYPES in shared/connectors.ts)
import { CONNECTOR_ALIASES, CONNECTOR_TYPES, ConnectorType } from "@/app/shared/connectors"

// Build a reverse lookup including aliases
const DIRECT: Record<string, ConnectorType> = CONNECTOR_TYPES.reduce(
  (acc, k) => {
    acc[k] = k
    return acc
  },
  {} as Record<string, ConnectorType>,
)

const ALIASES: Record<string, ConnectorType> = Object.entries(CONNECTOR_ALIASES).reduce(
  (acc, [raw, canon]) => {
    acc[canonicalKey(raw)] = canon
    return acc
  },
  {} as Record<string, ConnectorType>,
)

function canonicalKey(s: string) {
  return s.replace(/\s|_|-|\./g, "").toUpperCase()
}

export function normalizeConnector(raw?: string): ConnectorType | "" {
  if (!raw) return ""
  const key = canonicalKey(raw)

  if (DIRECT[key]) return DIRECT[key]
  if (ALIASES[key]) return ALIASES[key]

  // Heuristics
  if (key.startsWith("CCS2")) return "CCS2"
  if (key.startsWith("CCS1")) return "CCS1"
  if (key.startsWith("CCS")) return "CCS"
  if (key.includes("MENNEKES")) return "TYPE2"
  if (key.includes("J1772")) return "TYPE1"
  if (key.includes("GBT")) return "GB_T"
  if (key.includes("SCHUKO")) return "SCHUKO"

  // Fallback: if not in allowed list, return empty to avoid mismatches
  return "" as ""
}