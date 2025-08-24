"use client"

import { useState, useEffect } from "react"
import { StationList } from "./_components/StationList"
import { AddStationModal } from "./_components/AddStationModal"
import { EditStationModal } from "./_components/EditStationModal"
import { ActiveSessionsList } from "./_components/ActiveSessionsList"
import { ReviewList } from "./_components/ReviewList"
import type { Station } from "./types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Zap,
  BarChart3,
  Calendar,
  Activity,
  Users,
  MapPin,
  Plus,
  AlertTriangle,
  Clock,
  Star,
  TrendingUp,
  LogOut,
} from "lucide-react"
import Spotlight from "@/components/creative/spotlight"
import TiltCard from "@/components/creative/tilt-card"
import { ReservationList } from "./_components/ReservationList"
import { ReclamationList } from "./_components/ReclamationList"
import { ConnectorEditor } from "./_components/ConnectorEditor"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function OwnerDashboard() {
  const [stations, setStations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [todaySessions, setTodaySessions] = useState(0)
  const [reservations, setReservations] = useState([])
  const [reclamations, setReclamations] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeView, setActiveView] = useState("overview")
  const router = useRouter()

  const totalConnectors = stations.reduce((acc, s) => acc + (s.connectors?.length || 0), 0)
  const activeConnectors = stations.reduce(
    (acc, s) => acc + (s.connectors?.filter((c) => c.status === "available").length || 0),
    0,
  )
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0"
  const pendingReclamations = reclamations.filter((r: any) => r.status === "pending").length
  const pendingReviews = reviews.filter((r: any) => !r.ownerResponse).length

  const fetchStations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
      if (!ownerId) throw new Error("Owner not logged in.")
      const res = await fetch(
        `${(process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")}/stations?ownerId=${encodeURIComponent(
          ownerId,
        )}`,
      )
      if (!res.ok) throw new Error("Failed to fetch stations.")
      const data = await res.json()
      setStations(data)
    } catch (e: any) {
      setError(e.message || "Failed to load stations.")
      setStations([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStations()
  }, [])

  useEffect(() => {
    const fetchTodaySessions = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const response = await fetch(
        `http://localhost:5000/charging-sessions?startTime_gte=${today.toISOString()}&startTime_lt=${tomorrow.toISOString()}`,
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

  useEffect(() => {
    const fetchReclamations = async () => {
      const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
      const response = await fetch(`http://localhost:5000/reclamations?ownerId=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setReclamations(data)
      } else {
        setReclamations([])
      }
    }
    fetchReclamations()
  }, [])

  useEffect(() => {
    const fetchActiveSessions = async () => {
      const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
      const response = await fetch(`http://localhost:5000/charging-sessions?ownerId=${ownerId}&status=active`)
      if (response.ok) {
        const data = await response.json()
        setActiveSessions(data)
      } else {
        setActiveSessions([])
      }
    }
    fetchActiveSessions()

    const interval = setInterval(fetchActiveSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchReviews = async () => {
      const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
      const response = await fetch(`http://localhost:5000/reviews?ownerId=${ownerId}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      } else {
        setReviews([])
      }
    }
    fetchReviews()
  }, [])

  const handleEdit = (station: Station | null) => {
    if (station) {
      setEditingStation(station)
    } else {
      setShowAddModal(true)
    }
  }

  const handleCloseEdit = () => {
    setEditingStation(null)
  }

  const handleCloseAdd = () => {
    setShowAddModal(false)
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ownerId")
    }
    router.push("/sign-in")
  }

  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: TrendingUp,
      badge: null,
    },
    {
      id: "stations",
      label: "Stations",
      icon: MapPin,
      badge: stations.length,
    },
    {
      id: "active-sessions",
      label: "Active Sessions",
      icon: Clock,
      badge: activeSessions.length,
    },
    {
      id: "reservations",
      label: "Reservations",
      icon: Calendar,
      badge: reservations.length,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      badge: pendingReviews > 0 ? pendingReviews : null,
    },
    {
      id: "reclamations",
      label: "Issues",
      icon: AlertTriangle,
      badge: pendingReclamations > 0 ? pendingReclamations : null,
    },
    {
      id: "connectors",
      label: "Hardware",
      icon: Activity,
      badge: null,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      badge: null,
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-emerald-200 blur-3xl opacity-70" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-amber-100 blur-3xl opacity-70" />
        </div>

        <Spotlight className="relative">
          <div className="container mx-auto px-4 py-8 lg:py-12">
            <TiltCard className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-2xl max-w-md mx-auto">
              <Card className="border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin">
                      <Zap className="h-16 w-16 text-emerald-600 mb-6" />
                    </div>
                    <div className="absolute inset-0 animate-ping">
                      <Zap className="h-16 w-16 text-emerald-300 opacity-20" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Dashboard</h3>
                  <p className="text-gray-600 text-center">Preparing your station management portal...</p>
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
          <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-red-200 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-orange-200 blur-3xl opacity-70" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-yellow-100 blur-3xl opacity-70" />
        </div>

        <Spotlight className="relative">
          <div className="container mx-auto px-4 py-8 lg:py-12">
            <TiltCard className="bg-white/95 backdrop-blur-sm border border-red-100 shadow-2xl max-w-md mx-auto">
              <Card className="border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-red-500 text-center">
                    <AlertTriangle className="h-16 w-16 mx-auto mb-6" />
                    <h3 className="text-xl font-bold mb-3">Connection Error</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={fetchStations} className="bg-red-600 hover:bg-red-700">
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

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: MapPin,
                  title: "Total Stations",
                  value: stations.length,
                  subtitle: `${totalConnectors} connectors`,
                  color: "text-emerald-600",
                  bg: "bg-emerald-100",
                  trend: "+12%",
                },
                {
                  icon: Activity,
                  title: "Active Now",
                  value: activeSessions.length,
                  subtitle: `${activeConnectors} available`,
                  color: "text-blue-600",
                  bg: "bg-blue-100",
                  trend: "+8%",
                },
                {
                  icon: Users,
                  title: "Today's Sessions",
                  value: todaySessions,
                  subtitle: "charging sessions",
                  color: "text-purple-600",
                  bg: "bg-purple-100",
                  trend: "+15%",
                },
                {
                  icon: Star,
                  title: "Average Rating",
                  value: averageRating,
                  subtitle: `${reviews.length} reviews`,
                  color: "text-yellow-600",
                  bg: "bg-yellow-100",
                  trend: "+0.2",
                },
              ].map((stat, i) => (
                <TiltCard
                  key={i}
                  className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <Card className="border-none shadow-none">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.bg} shadow-sm`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <TrendingUp className="h-3 w-3" />
                          {stat.trend}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm font-medium text-gray-900">{stat.title}</div>
                        <div className="text-xs text-gray-500">{stat.subtitle}</div>
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              ))}
            </div>

            {(pendingReclamations > 0 || pendingReviews > 0) && (
              <TiltCard className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 shadow-lg">
                <Card className="border-none shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-800">Action Required</h3>
                        <p className="text-sm text-yellow-700">
                          {pendingReclamations > 0 &&
                            `${pendingReclamations} pending reclamation${pendingReclamations > 1 ? "s" : ""}`}
                          {pendingReclamations > 0 && pendingReviews > 0 && " and "}
                          {pendingReviews > 0 &&
                            `${pendingReviews} review${pendingReviews > 1 ? "s" : ""} awaiting response`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            )}
          </div>
        )

      case "stations":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Station Management</h2>
                <p className="text-gray-600">Monitor and control your charging infrastructure</p>
              </div>
              <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Station
              </Button>
            </div>
            <Separator />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {isLoading && <p className="text-sm text-gray-500">Loading stations...</p>}
            <StationList stations={stations} onEdit={handleEdit} onDataChange={fetchStations} />
          </div>
        )

      case "active-sessions":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Active Charging Sessions</h2>
                <p className="text-gray-600">Monitor ongoing sessions and completion estimates</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                <Activity className="h-3 w-3 mr-1" />
                {activeSessions.length} Active
              </Badge>
            </div>
            <Separator />
            <ActiveSessionsList
              sessions={activeSessions}
              onDataChange={() => {
                const fetchActiveSessions = async () => {
                  const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
                  const response = await fetch(
                    `http://localhost:5000/charging-sessions?ownerId=${ownerId}&status=active`,
                  )
                  if (response.ok) {
                    const data = await response.json()
                    setActiveSessions(data)
                  }
                }
                fetchActiveSessions()
              }}
            />
          </div>
        )

      case "reservations":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservations</h2>
              <p className="text-gray-600">Manage customer bookings and schedules</p>
            </div>
            <Separator />
            <ReservationList reservations={reservations} />
          </div>
        )

      case "reviews":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                <p className="text-gray-600">Manage customer feedback and ratings</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {pendingReviews} Pending
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  {reviews.length} Total
                </Badge>
              </div>
            </div>
            <Separator />
            <ReviewList
              reviews={reviews}
              onDataChange={() => {
                const fetchReviews = async () => {
                  const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
                  const response = await fetch(`http://localhost:5000/reviews?ownerId=${ownerId}`)
                  if (response.ok) {
                    const data = await response.json()
                    setReviews(data)
                  }
                }
                fetchReviews()
              }}
            />
          </div>
        )

      case "reclamations":
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Issue Management</h2>
                <p className="text-gray-600">Handle customer complaints and technical issues</p>
              </div>
              <Badge className="bg-red-100 text-red-800 px-3 py-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {pendingReclamations} Pending
              </Badge>
            </div>
            <Separator />
            <ReclamationList
              reclamations={reclamations}
              onDataChange={() => {
                const fetchReclamations = async () => {
                  const ownerId = typeof window !== "undefined" ? localStorage.getItem("ownerId") : null
                  const response = await fetch(`http://localhost:5000/reclamations?ownerId=${ownerId}`)
                  if (response.ok) {
                    const data = await response.json()
                    setReclamations(data)
                  }
                }
                fetchReclamations()
              }}
            />
          </div>
        )

      case "connectors":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hardware Management</h2>
              <p className="text-gray-600">Monitor and control individual charging connectors</p>
            </div>
            <Separator />
            {stations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No Connectors Found</h3>
                <p>Add stations to manage their connectors.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {stations.map((station) => (
                  <div key={station._id}>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{station.stationName}</h3>
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
                ))}
              </div>
            )}
          </div>
        )

      case "analytics":
        return (
          <div className="text-center py-16">
            <div className="relative mb-6">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-10 rounded-full blur-xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Advanced Analytics</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Comprehensive insights, revenue tracking, and performance metrics coming soon.
            </p>
            <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lime-500 via-emerald-500 to-emerald-600 grid place-items-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900">Station Portal</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Owner Dashboard</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <div className="mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-lime-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 grid place-items-center text-white font-bold text-lg">
                    O
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Station Owner</div>
                    <div className="text-sm text-gray-600">Premium Account</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/80 rounded-lg p-2">
                    <div className="text-lg font-bold text-emerald-600">{stations.length}</div>
                    <div className="text-xs text-gray-600">Stations</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2">
                    <div className="text-lg font-bold text-blue-600">{activeSessions.length}</div>
                    <div className="text-xs text-gray-600">Active</div>
                  </div>
                </div>
              </div>
            </div>

            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeView === item.id}
                    onClick={() => setActiveView(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge !== null && (
                      <Badge className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-3 py-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {stations.length} Station{stations.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-30" />
              <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-emerald-200 blur-3xl opacity-30" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-amber-100 blur-3xl opacity-30" />
            </div>

            <Spotlight className="relative">{renderContent()}</Spotlight>
          </div>
        </SidebarInset>
      </div>

      {showAddModal && <AddStationModal open={showAddModal} setOpen={setShowAddModal} onStationAdded={fetchStations} />}

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
    </SidebarProvider>
  )
}
