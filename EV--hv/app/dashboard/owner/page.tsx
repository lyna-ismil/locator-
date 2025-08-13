"use client"

import { useState, useEffect } from "react"
import { StationList } from "./_components/StationList"
import { AddStationModal } from "./_components/AddStationModal"
import { EditStationModal } from "./_components/EditStationModal"
import type { Station } from "./types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Zap, BarChart3, Calendar, Activity, TrendingUp, Users, MapPin, Plus } from "lucide-react"
import Spotlight from "@/components/creative/spotlight"
import TiltCard from "@/components/creative/tilt-card"
import { ReservationList } from "./_components/ReservationList"
import { ConnectorEditor } from "./_components/ConnectorEditor";
import { useRouter } from "next/navigation"


export default function OwnerDashboard() {
  const [stations, setStations] = useState<Station[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [todaySessions, setTodaySessions] = useState(0)
  const [reservations, setReservations] = useState([])
  const router = useRouter();

  // Central function to fetch/refresh station data
  const fetchStations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null;
      if (!ownerId) {
        throw new Error("Owner not logged in.")
      }
      const response = await fetch(`http://localhost:5000/stations?ownerId=${ownerId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch stations. Please ensure the API is running.")
      }
      const data = await response.json()
      setStations(data)
    } catch (err: any) {
      setError(err.message || "Unknown error occurred.")
      setStations([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when the component mounts
  useEffect(() => {
    fetchStations()
  }, [])

  // Fetch today's sessions
  useEffect(() => {
    const fetchTodaySessions = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const response = await fetch(
        `http://localhost:5000/charging-sessions?startTime_gte=${today.toISOString()}&startTime_lt=${tomorrow.toISOString()}`
      )
      if (response.ok) {
        const data = await response.json()
        setTodaySessions(data.length)
      } else {
        setTodaySessions(0)
      }
    }
    fetchTodaySessions()
  }, [])

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
      const response = await fetch(`http://localhost:5000/reservations?ownerId=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setReservations(data)
      } else {
        setReservations([])
      }
    }
    fetchReservations()
  }, [])

  // Handler to open the edit modal
  const handleEdit = (station: Station | null) => {
    if (station) {
      setEditingStation(station)
    } else {
      setShowAddModal(true)
    }
  }

  // Handler to close the edit modal
  const handleCloseEdit = () => {
    setEditingStation(null)
  }

  const handleCloseAdd = () => {
    setShowAddModal(false)
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ownerId");
    }
    router.push("/sign-in");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-emerald-200 blur-3xl opacity-70" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-amber-100 blur-3xl opacity-70" />
        </div>

        <Spotlight className="relative">
          <div className="container mx-auto px-4 py-10">
            <TiltCard className="bg-white/90 border border-gray-100 shadow-xl max-w-md mx-auto">
              <Card className="border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin">
                    <Zap className="h-12 w-12 text-emerald-600 mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Loading your dashboard...</h3>
                </CardContent>
              </Card>
            </TiltCard>
          </div>
        </Spotlight>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-emerald-200 blur-3xl opacity-70" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-amber-100 blur-3xl opacity-70" />
        </div>

        <Spotlight className="relative">
          <div className="container mx-auto px-4 py-10">
            <TiltCard className="bg-white/90 border border-gray-100 shadow-xl max-w-md mx-auto">
              <Card className="border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-red-500 text-center">
                    <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
                    <p className="text-gray-600">{error}</p>
                    <Button className="mt-4" onClick={fetchStations}>
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TiltCard>
          </div>
        </Spotlight>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-70" />
        <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-emerald-200 blur-3xl opacity-70" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-amber-100 blur-3xl opacity-70" />
      </div>

      <Spotlight className="relative">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center shadow-sm">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">Station Dashboard</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Owner Portal</div>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              {stations.length} Station{stations.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={handleLogout}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white"
            >
              Log Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: MapPin,
                title: "Total Stations",
                value: stations.length,
                color: "text-emerald-600",
                bg: "bg-emerald-100",
              },
              {
                icon: Activity,
                title: "Active Connectors",
                value: stations.reduce((acc, s) => acc + (s.connectors?.length || 0), 0),
                color: "text-blue-600",
                bg: "bg-blue-100",
              },
              {
                icon: Users,
                title: "Today's Sessions",
                value: todaySessions,
                color: "text-purple-600",
                bg: "bg-purple-100",
              },
            ].map((stat, i) => (
              <TiltCard key={i} className="bg-white/90 border border-gray-100 shadow-xl">
                <Card className="border-none shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.title}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            ))}
          </div>

          <TiltCard className="bg-white/90 border border-gray-100 shadow-xl">
            <Card className="border-none shadow-none">
              <CardContent className="p-6">
                <Tabs defaultValue="stations" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                    <TabsTrigger value="stations" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      My Stations
                    </TabsTrigger>
                    <TabsTrigger value="reservations" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Reservations
                    </TabsTrigger>
                    <TabsTrigger value="connectors" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Connectors
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stations" className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">Station Management</h2>
                        <p className="text-gray-600">Monitor and control your charging stations</p>
                      </div>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground shadow-xs h-9 px-4 py-2 has-[>svg]:px-3 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Station
                      </Button>
                    </div>
                    <StationList onEdit={handleEdit} onDataChange={fetchStations} />
                  </TabsContent>

                  <TabsContent value="reservations" className="space-y-6">
                    <ReservationList reservations={reservations} />
                  </TabsContent>

                  <TabsContent value="connectors" className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Connector Management</h3>
                    {stations.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">No connectors found.</div>
                    ) : (
                      stations.map((station) => (
                        <div key={station._id} className="mb-8">
                          <div className="font-bold mb-2">{station.stationName}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {station.connectors.map((connector, idx) => (
                              <ConnectorEditor
                                key={connector._id || idx}
                                connector={connector}
                                stationId={station._id}
                                fetchStations={fetchStations}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-6">
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Reports</h3>
                      <p className="text-gray-600">Track performance and revenue insights</p>
                      <Badge className="mt-4 bg-emerald-100 text-emerald-800">Coming Soon</Badge>
                    </div>
                  </TabsContent>
                  
                </Tabs>
              </CardContent>
            </Card>
          </TiltCard>
        </div>
      </Spotlight>

      {showAddModal && (
        <AddStationModal open={showAddModal} setOpen={setShowAddModal} onStationAdded={fetchStations} />
      )}

      {editingStation && (
        <EditStationModal
          station={editingStation}
          onClose={handleCloseEdit}
          onStationUpdated={() => {
            handleCloseEdit()
            fetchStations()
          }}
        />
      )}
    </div>
  )
}
