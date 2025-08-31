import type { ConnectorType, Preferences } from "@/app/shared/connectors"

export { CONNECTOR_TYPES } from "@/app/shared/connectors"

// Ensure VehicleDetails has id
export interface VehicleDetails {
  id?: string
  make: string
  model: string
  year?: number
  batteryCapacityKWh?: number // Added for consistency
  primaryConnector: ConnectorType
  adapters: ConnectorType[]
  maxAcPowerKw?: number
  maxDcPowerKw?: number
  rangeKm?: number
}

// Extend CarOwner / Driver profile if not already
export interface CarOwner {
  id: string;
  _id: string;
  email: string;
  fullName?: string;
  vehicleDetails: VehicleDetails; // Changed from vehicle
  favorites?: string[];
  chargingHistory?: Reservation[];
  paymentMethods?: string[];
  preferences?: Preferences;
  reservations?: Reservation[];
}

// Replace old Connector type (string) with enum-based:
export type Connector = {
  id: string; // This will be the UI-facing ID
  backendId?: string; // This will store the actual _id from the database
  type: ConnectorType;
  power: number;
  status: "available" | "busy" | "offline";
};


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
  photos?: string[];
}

export type Reservation = {
  id: string
  stationId: string
  chargerId: string
  startTime: string
  endTime: string
  expiresAt: string
  paymentMethod?: "Visa" | "OnSite"
  status?: "Confirmed" | "Active" | "Completed" | "Cancelled" | "Expired"
  station?: Pick<Station, "name" | "address">;
  batteryTarget?: number; // Added for consistency
  estimatedCost?: number; // Added for consistency
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