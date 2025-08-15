export type VehicleDetails = {
  make: string
  model: string
  year?: number
  primaryConnector: string
  maxChargingSpeed?: number
  adapters?: string[]
  batteryCapacity?: number
}

export type Preferences = {
  preferredNetworks?: string[]
  requiredAmenities?: string[]
}

export type CarOwner = {
  id: string
  fullName: string
  email: string
  password?: string
  vehicleDetails: VehicleDetails
  favoriteStations?: string[]
  chargingHistory?: Reservation[]
  paymentMethods?: string[]
  preferences?: Preferences
}

export type Connector = {
  id: string
  type: string
  power: number
  status: "available" | "busy" | "offline"
}

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