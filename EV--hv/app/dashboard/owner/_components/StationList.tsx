"use client"

import { useState, useEffect } from "react"
import type { Station } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Zap, Clock, DollarSign, Edit, Trash2, Power } from "lucide-react"

interface StationListProps {
  onEdit: (station: Station | null) => void
  onDataChange: () => void
}

export function StationList({ onEdit, onDataChange }: StationListProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Get logged-in ownerId from localStorage
  const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null;

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!ownerId) throw new Error("Owner not logged in.");
        const response = await fetch(`http://localhost:5000/stations?ownerId=${ownerId}`);
        if (!response.ok) throw new Error("Failed to fetch stations.");
        const data = await response.json();
        setStations(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setStations([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStations();
  }, [ownerId, onDataChange]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading stations...</h3>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (stations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stations found for your account</h3>
          <p className="text-gray-600 text-center">
            You haven't added any stations yet. Click below to add your first charging station.
          </p>
          <Button className="mt-4" onClick={() => onEdit(null)}>
            Add Station
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If there is only one station and it's incomplete, prompt to complete details
  if (
    stations.length === 1 &&
    (!stations[0].address?.street || !stations[0].connectors?.length)
  ) {
    const station = stations[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Station (Incomplete)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <strong>Name:</strong> {station.stationName || "N/A"}
          </div>
          <div className="mb-2">
            <strong>Network:</strong> {station.network || "N/A"}
          </div>
          <div className="mb-2">
            <strong>Address:</strong>{" "}
            {station.address
              ? [station.address.street, station.address.city, station.address.state, station.address.zipCode]
                  .filter(Boolean)
                  .join(", ")
              : "N/A"}
          </div>
          <div className="mb-2">
            <strong>Connectors:</strong>{" "}
            {station.connectors && station.connectors.length > 0
              ? station.connectors.map((c: any) => c.type).join(", ")
              : "None added yet"}
          </div>
          <p className="text-amber-600 mt-4">
            Your station profile is incomplete. Please add more details to make it available to drivers.
          </p>
          <Button className="mt-4" onClick={() => onEdit(station)}>
            Complete Station Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default: show all stations with details
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => (
        <Card key={station._id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              {station.stationName || "Unnamed Station"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>
                {station.address
                  ? [station.address.street, station.address.city, station.address.state, station.address.zipCode]
                      .filter(Boolean)
                      .join(", ")
                  : "N/A"}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Power className="h-4 w-4 text-gray-400" />
              <span>
                {station.connectors && station.connectors.length > 0
                  ? station.connectors.map((c: any) => c.type).join(", ")
                  : "No connectors"}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{station.operatingHours || "24/7"}</span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span>
                {station.pricing
                  ? [
                      station.pricing.perHour ? `Per Hour: $${station.pricing.perHour}` : null,
                      station.pricing.perkWh ? `Per kWh: $${station.pricing.perkWh}` : null,
                      station.pricing.sessionFee ? `Session Fee: $${station.pricing.sessionFee}` : null,
                    ]
                      .filter(Boolean)
                      .join(" | ")
                  : "No pricing info"}
              </span>
            </div>
            <div className="mb-2">
              {station.amenities &&
                Object.entries(station.amenities)
                  .filter(([_, v]) => v)
                  .map(([k]) => (
                    <Badge key={k} className="mr-1">{k}</Badge>
                  ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => onEdit(station)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                // You can implement handleDelete here if needed
                disabled={updatingStatus === station._id}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
