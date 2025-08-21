import { CONNECTOR_TYPES, ConnectorType } from "@/app/shared/connectors"

// Ensure VehicleDetails has id
export interface VehicleDetails {
  id?: string
  make: string
  model: string
  year?: number
  batteryCapacityKWh?: number
  primaryConnector: ConnectorType
  adapters: ConnectorType[]
  maxAcPowerKw?: number
  maxDcPowerKw?: number
  rangeKm?: number
}

// Extend CarOwner / Driver profile if not already
export interface CarOwner {
  id: string
  email: string
  name?: string
  vehicle?: VehicleDetails
  favorites?: string[]
  chargingHistory?: Reservation[]
  paymentMethods?: string[]
  preferences?: Preferences
}

// Replace old Connector type (string) with enum-based:
export type Connector = {
  id: string
  type: ConnectorType
  power: number
  status: "available" | "busy" | "offline"
}

// Ensure any Station interface uses: connectors: Connector[]
// (Adjust any creation sites to cast/map to ConnectorType if needed)
export type Review = {
  user: string
  rating: number
  text: string
  date: string
}

export type Station = {
  id: string
  name: string
  network: string
  address?: string
  location: { lat: number; lng: number }
  connectors: Connector[]
  amenities: string[]
  pricing?: string
  availability?: number
  distance?: number
  rating?: string | number
  reviews?: Review[]
}

export type Reservation = {
  id: string
  stationId: string
  chargerId: string
  expiresAt: string
  paymentMethod?: "Visa" | "OnSite"
  status?: "active" | "expired" | "cancelled"
}

export type Reclamation = {
  stationId: string
  reservationId?: string
  category: string
  description: string
  photos?: string[]
  contactEmail: string
  status: "open" | "in_review" | "resolved"
}