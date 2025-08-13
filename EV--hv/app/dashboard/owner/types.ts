export interface Connector {
  _id: string; // From MongoDB
  type: string;
  chargerLevel: string;
  powerKW: number;
  status: 'Available' | 'In Use' | 'Reserved' | 'Faulted' | 'Offline';
}

export interface Station {
  _id: string; // From MongoDB
  stationName: string;
  network: string;
  photoUrl?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  operatingHours: string;
  connectors: Connector[];
  pricing: {
    perHour?: number;
    perkWh?: number;
    sessionFee?: number;
    notes?: string;
  };
  amenities: {
    wifi?: boolean;
    restrooms?: boolean;
    food?: boolean;
    shopping?: boolean;
  };
  createdAt: string; // From Mongoose timestamps
  updatedAt: string; // From Mongoose timestamps
}
