// /app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react";
import { StationList } from "./_components/StationList";
import { AddStationModal } from "./_components/AddStationModal";
import { EditStationModal } from "./_components/EditStationModal";
import { Station } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap } from "lucide-react";

export default function OwnerDashboard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // Central function to fetch/refresh station data
  const fetchStations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null;
      if (!ownerId) {
        throw new Error("Owner not logged in.");
      }
      const response = await fetch(`http://localhost:5000/stations?ownerId=${ownerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stations. Please ensure the API is running.');
      }
      const data = await response.json();
      setStations(data);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred.");
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchStations();
  }, []);

  // Handler to open the edit modal
  const handleEdit = (station: Station) => {
    setEditingStation(station);
  };

  // Handler to close the edit modal
  const handleCloseEdit = () => {
    setEditingStation(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading station data...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  // If there is only one station and it's incomplete, show a summary card and prompt to complete details
  if (
    stations.length === 1 &&
    (!stations[0].address?.street || !stations[0].connectors?.length)
  ) {
    const station = stations[0];
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b p-4">
          <div className="container mx-auto flex items-center space-x-2">
            <Zap className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">Owner Dashboard</span>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Station Management</h1>
              <p className="text-gray-600">You have started creating your first station. Please complete the details below.</p>
            </div>
            <AddStationModal onStationAdded={fetchStations} />
          </div>
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Your Station (Incomplete)</h2>
              <div className="mb-2"><strong>Name:</strong> {station.stationName || "N/A"}</div>
              <div className="mb-2"><strong>Network:</strong> {station.network || "N/A"}</div>
              <div className="mb-2"><strong>Address:</strong> {station.address
                ? [station.address.street, station.address.city, station.address.state, station.address.zipCode].filter(Boolean).join(", ")
                : "N/A"}
              </div>
              <div className="mb-2"><strong>Connectors:</strong> {station.connectors && station.connectors.length > 0
                ? station.connectors.map((c: any) => c.type).join(", ")
                : "None added yet"}
              </div>
              <p className="text-amber-600 mt-4">
                Your station profile is incomplete. Please add more details to make it available to drivers.
              </p>
              <button
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                onClick={() => handleEdit(station)}
              >
                Complete Station Details
              </button>
            </div>
          </div>
        </div>
        {editingStation && (
          <EditStationModal
            station={editingStation}
            onClose={handleCloseEdit}
            onStationUpdated={() => {
              handleCloseEdit();
              fetchStations();
            }}
          />
        )}
      </div>
    );
  }

  // Default: show all stations with details
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto flex items-center space-x-2">
          <Zap className="h-6 w-6 text-green-600" />
          <span className="text-xl font-bold">Owner Dashboard</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Station Management</h1>
            <p className="text-gray-600">You are managing {stations.length} charging stations.</p>
          </div>
          <AddStationModal onStationAdded={fetchStations} />
        </div>

        <Tabs defaultValue="stations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stations">My Stations</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stations">
            <StationList stations={stations} onEdit={handleEdit} onDataChange={fetchStations} />
          </TabsContent>
          <TabsContent value="reservations">
            <p>Reservation management UI will go here.</p>
          </TabsContent>
          <TabsContent value="analytics">
            <p>Analytics and reporting UI will go here.</p>
          </TabsContent>
        </Tabs>
      </div>

      {editingStation && (
        <EditStationModal
          station={editingStation}
          onClose={handleCloseEdit}
          onStationUpdated={() => {
            handleCloseEdit();
            fetchStations();
          }}
        />
      )}
    </div>
  );
}
