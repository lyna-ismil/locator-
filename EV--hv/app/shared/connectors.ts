export const CONNECTOR_TYPES = ["TYPE1", "TYPE2", "CHAdeMO", "CCS", "TESLA", "GB/T"] as const

export type ConnectorType = (typeof CONNECTOR_TYPES)[number]

// Enhanced vehicle details interface with better structure
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
  maxChargingSpeed?: number
  rangeKm?: number
}

// Enhanced preferences interface
export interface Preferences {
  preferredNetworks: string[]
  requiredAmenities: string[]
  maxDistance?: number
  priceRange?: { min: number; max: number }
  chargingSpeed?: "slow" | "fast" | "rapid"
}

// Enhanced car owner interface
export interface CarOwner {
  id: string
  _id?: string
  fullName: string
  email: string
  phone?: string
  location?: string
  vehicle?: VehicleDetails
  vehicleDetails?: VehicleDetails
  favorites?: string[]
  chargingHistory?: Reservation[]
  paymentMethods?: string[]
  preferences?: Preferences
}

// Enhanced connector interface with status and availability
export interface Connector {
  id: string
  type: ConnectorType
  power: number
  status: "available" | "busy" | "offline" | "maintenance"
  maxPower?: number
  currentPower?: number
  estimatedWaitTime?: number
}

// Enhanced station interface with comprehensive details
export interface Station {
  id: string
  _id?: string
  name: string
  stationName?: string
  network: string
  address?: string | { street?: string; city?: string; state?: string; zipCode?: string }
  location: { lat: number; lng: number }
  connectors: Connector[]
  amenities: string[]
  pricing?: string | { perKwh?: number; perHour?: number; sessionFee?: number }
  availability?: number
  distance?: number
  rating?: string | number
  reviews?: Review[]
  operatingHours?: string
  photos?: string[]
  isOpen?: boolean
  lastUpdated?: string
}

// Enhanced reservation interface
export interface Reservation {
  id: string
  stationId: string
  chargerId: string
  userId?: string
  startTime?: string
  endTime?: string
  expiresAt: string
  paymentMethod?: "Visa" | "OnSite" | "Mastercard" | "PayPal"
  status?: "active" | "expired" | "cancelled" | "completed"
  cost?: number
  duration?: number
  energyDelivered?: number
  date?: string
  estimatedCost?: number
  actualCost?: number
}

// Enhanced reclamation interface
export interface Reclamation {
  id?: string
  submittedBy?: string
  stationId?: string
  relatedStation?: string
  reservationId?: string
  title?: string
  category: string
  description: string
  photos?: string[]
  contactEmail?: string
  status: "open" | "Open" | "in_review" | "resolved" | "closed"
  priority?: "low" | "medium" | "high"
  createdAt?: string
  updatedAt?: string
  response?: string
}

// Enhanced review interface
export interface Review {
  id?: string
  user: string
  userId?: string
  stationId?: string
  rating: number
  text: string
  date: string
  helpful?: number
  category?: string
  verified?: boolean
}

// Export all types for easy importing
export type {
  ConnectorType,
  VehicleDetails,
  Preferences,
  CarOwner,
  Connector,
  Station,
  Reservation,
  Reclamation,
  Review,
}
