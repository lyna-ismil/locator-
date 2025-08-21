export const CONNECTOR_TYPES = [
  "CCS",
  "CCS1",
  "CCS2",
  "TYPE2",
  "TYPE1",
  "CHADEMO",
  "TESLA",
  "GB_T",
  "SCHUKO",
  "UK_3_PIN",
] as const
export type ConnectorType = typeof CONNECTOR_TYPES[number]

export const CONNECTOR_STATUSES = ["Available", "InUse", "OutOfOrder"] as const
export type ConnectorStatus = typeof CONNECTOR_STATUSES[number]

export interface StandardConnector {
  id?: string
  type: ConnectorType
  chargerLevel: string         // e.g. "AC Level 2", "DC Fast"
  powerKW: number
  status: ConnectorStatus
}

export function normalizeConnectorType(raw: string): ConnectorType | null {
  const norm = raw.replace(/[\s_-]/g, "").toUpperCase()
  const map: Record<string, ConnectorType> = {
    CCS: "CCS",
    CCS1: "CCS1",
    CCS2: "CCS2",
    TYPE2: "TYPE2",
    MENNEKES: "TYPE2",
    TYPE1: "TYPE1",
    J1772: "TYPE1",
    CHADEMO: "CHADEMO",
    TESLA: "TESLA",
    GBT: "GB_T",
    GBTDC: "GB_T",
    SCHUKO: "SCHUKO",
    UK3PIN: "UK_3_PIN",
  }
  return (map[norm] as ConnectorType) || null
}