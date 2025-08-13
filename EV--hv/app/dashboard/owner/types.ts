export interface Connector {
  _id?: string // MongoDB ID for existing connectors
  type: string
  chargerLevel: string
  powerKW: number
  status: "available" | "unavailable" | "charging" | "maintenance" | "faulted" | "offline"
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
  _id?: string // MongoDB ID
  stationName: string
  network: string
  address: Address
  location: Location
  operatingHours: OperatingHours
  connectors: Connector[]
  pricing: Pricing
  amenities: Amenities
  photos?: string[]
  ownerId: string
  reservations?: Reservation[]
  createdAt?: string
  updatedAt?: string
}
