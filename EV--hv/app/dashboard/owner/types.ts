import { ConnectorType, ConnectorStatus } from "@/app/shared/connectors"

export interface Connector {
  _id?: string
  type: ConnectorType
  chargerLevel: string
  powerKW: number
  status: ConnectorStatus
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}

export interface Location {
  latitude: number
  longitude: number
  coordinates?: [number, number] // [longitude, latitude] for MongoDB
}

export interface OperatingHours {
  [key: string]: {
    open: string
    close: string
    is24Hours: boolean
    isClosed: boolean
  }
}

export interface Pricing {
  perHour?: number
  perkWh?: number
  sessionFee?: number
  peakHourSurcharge?: number
  peakHours?: {
    start: string
    end: string
  }
  notes?: string
}

export interface Amenities {
  wifi?: boolean
  restrooms?: boolean
  food?: boolean
  shopping?: boolean
  parking?: boolean
  coffee?: boolean
}

export interface Reservation {
  _id: string
  customerId: string
  customerName: string
  customerEmail: string
  connectorIndex: number
  startTime: string
  endTime: string
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
  estimatedCost: number
  vehicleInfo?: {
    make: string
    model: string
    connector: string
  }
}

export interface Station {
  _id?: string
  stationName: string
  network: string
  location: { type: "Point"; coordinates: [number, number] }
  address?: { street?: string; city?: string; state?: string; zipCode?: string }
  connectors: Connector[]
  pricing?: any
  amenities?: Record<string, boolean>
  operatingHours?: Record<string, any>
  ownerId?: string
  createdAt?: string
  updatedAt?: string
}
