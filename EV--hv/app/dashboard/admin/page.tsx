"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Users,
  MapPin,
  AlertTriangle,
  Activity,
  BarChart3,
  Settings,
  Database,
  TrendingUp,
  UserCheck,
  Zap,
  Clock,
  Star,
} from "lucide-react"
import Spotlight from "@/components/creative/spotlight"
import TiltCard from "@/components/creative/tilt-card"
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
import DriverManagement from "./_components/DriverManagement"
import StationManagement from "./_components/StationManagement"
import ReclamationsManagement from "./_components/ReclamationsManagement"
import AdminMap from "./_components/AdminMap"

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState("overview")
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalOwners: 0,
    totalStations: 0,
    totalConnectors: 0,
    activeConnectors: 0,
    pendingReclamations: 0,
    todaySessions: 0,
    averageRating: "0.0",
    totalRevenue: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch real stats from backend
        const [driversRes, ownersRes, stationsRes, sessionsRes, reviewsRes, reclamationsRes] = await Promise.all([
          fetch("http://localhost:5000/car-owners"),
          fetch("http://localhost:5000/users?role=owner"),
          fetch("http://localhost:5000/stations"),
          fetch("http://localhost:5000/charging-sessions"),
          fetch("http://localhost:5000/reviews"),
          fetch("http://localhost:5000/reclamations"),
        ])

        const drivers = driversRes.ok ? await driversRes.json() : []
        const owners = ownersRes.ok ? await ownersRes.json() : []
        const stations = stationsRes.ok ? await stationsRes.json() : []
        const sessions = sessionsRes.ok ? await sessionsRes.json() : []
        const reviews = reviewsRes.ok ? await reviewsRes.json() : []
        const reclamations = reclamationsRes.ok ? await reclamationsRes.json() : []

        const totalConnectors = stations.reduce((sum, s) => sum + (s.connectors?.length || 0), 0)
        const activeConnectors = stations.reduce(
          (sum, s) => sum + (s.connectors?.filter((c: any) => c.status === "available").length || 0),
          0,
        )
        const todaySessions = sessions.filter((s: any) => {
          const date = new Date(s.startTime || s.createdAt)
          const today = new Date()
          return date.toDateString() === today.toDateString()
        }).length
        const averageRating =
          reviews.length > 0
            ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
            : "0.0"
        const totalRevenue = sessions.reduce((sum: number, s: any) => sum + (s.totalCost || s.cost || 0), 0)
        const pendingReclamations = reclamations.filter((r: any) => r.status === "pending").length

        setStats({
          totalDrivers: drivers.length,
          totalOwners: owners.length,
          totalStations: stations.length,
          totalConnectors,
          activeConnectors,
          pendingReclamations,
          todaySessions,
          averageRating,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        })
      } catch (e: any) {
        setError(e.message || "Failed to load admin data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminStats()
  }, [])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminId")
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
      id: "drivers",
      label: "Drivers",
      icon: Users,
      badge: stats.totalDrivers,
    },
    {
      id: "owners",
      label: "Station Owners",
      icon: UserCheck,
      badge: stats.totalOwners,
    },
    {
      id: "stations",
      label: "All Stations",
      icon: MapPin,
      badge: stats.totalStations,
    },
    {
      id: "reclamations",
      label: "Reclamations",
      icon: AlertTriangle,
      badge: stats.pendingReclamations > 0 ? stats.pendingReclamations : null,
    },
    {
      id: "map",
      label: "Station Map",
      icon: Database,
      badge: null,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "settings",
      label: "System Settings",
      icon: Settings,
      badge: null,
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-blue-200 blur-3xl opacity-70" />
          <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-purple-200 blur-3xl opacity-70" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-indigo-100 blur-3xl opacity-70" />
        </div>

        <Spotlight className="relative">
          <div className="container mx-auto px-4 py-8 lg:py-12">
            <TiltCard className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-2xl max-w-md mx-auto">
              <Card className="border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin">
                      <Shield className="h-16 w-16 text-blue-600 mb-6" />
                    </div>
                    <div className="absolute inset-0 animate-ping">
                      <Shield className="h-16 w-16 text-blue-300 opacity-20" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Admin Panel</h3>
                  <p className="text-gray-600 text-center">Preparing system management dashboard...</p>
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
                    <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
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
            {/* FIRST stats block (overview cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Users,
                  title: "Total Drivers",
                  value: stats.totalDrivers,
                  subtitle: "registered users",
                  color: "text-blue-600",
                  bg: "bg-blue-100",
                  trend: "+12%",
                },
                {
                  icon: UserCheck,
                  title: "Station Owners",
                  value: stats.totalOwners,
                  subtitle: "verified owners",
                  color: "text-green-600",
                  bg: "bg-green-100",
                  trend: "+8%",
                },
                {
                  icon: MapPin,
                  title: "Total Stations",
                  value: stats.totalStations,
                  subtitle: `${stats.totalConnectors} connectors`,
                  color: "text-emerald-600",
                  bg: "bg-emerald-100",
                  trend: "+15%",
                },
                {
                  icon: Activity,
                  title: "Active Connectors",
                  value: stats.activeConnectors,
                  subtitle: `of ${stats.totalConnectors} total`,
                  color: "text-purple-600",
                  bg: "bg-purple-100",
                  trend: "+5%",
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

            {/* SECOND stats block (today/revenue/rating cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Clock,
                  title: "Today's Sessions",
                  value: stats.todaySessions,
                  subtitle: "charging sessions",
                  color: "text-orange-600",
                  bg: "bg-orange-100",
                },
                {
                  icon: Star,
                  title: "Average Rating",
                  value: stats.averageRating,
                  subtitle: "network rating",
                  color: "text-yellow-600",
                  bg: "bg-yellow-100",
                },
                {
                  icon: Zap,
                  title: "Total Revenue",
                  value: `${stats.totalRevenue.toFixed(2)} DT`,
                  subtitle: "platform revenue",
                  color: "text-indigo-600",
                  bg: "bg-indigo-100",
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

            {stats.pendingReclamations > 0 && (
              <TiltCard className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 shadow-lg">
                <Card className="border-none shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-800">Urgent Action Required</h3>
                        <p className="text-sm text-red-700">
                          {stats.pendingReclamations} pending reclamation{stats.pendingReclamations > 1 ? "s" : ""}{" "}
                          require admin attention
                        </p>
                      </div>
                      <Button onClick={() => setActiveView("reclamations")} className="bg-red-600 hover:bg-red-700">
                        Review Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            )}
          </div>
        )

      case "drivers":
        return <DriverManagement />

      case "owners":
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Station Owners</h2>
            <OwnerList />
          </div>
        )

      case "stations":
        return <StationManagement />

      case "reclamations":
        return <ReclamationsManagement />

      case "map":
        return <AdminMap />

      default:
        return (
          <div className="text-center py-16">
            <div className="relative mb-6">
              <Shield className="h-16 w-16 text-gray-300 mx-auto" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 opacity-10 rounded-full blur-xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Feature Coming Soon</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This admin feature is currently under development and will be available soon.
            </p>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              In Development
            </Badge>
          </div>
        )
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 grid place-items-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900">Admin Panel</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">System Management</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <div className="mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white font-bold text-lg">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">System Admin</div>
                    <div className="text-sm text-gray-600">Full Access</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/80 rounded-lg p-2">
                    <div className="text-lg font-bold text-blue-600">{stats.totalStations}</div>
                    <div className="text-xs text-gray-600">Stations</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2">
                    <div className="text-lg font-bold text-purple-600">{stats.totalDrivers + stats.totalOwners}</div>
                    <div className="text-xs text-gray-600">Users</div>
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
                      <Badge className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-0.5">{item.badge}</Badge>
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
              <Shield className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-3 py-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Access
                </Badge>
                {stats.pendingReclamations > 0 && (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 px-3 py-1">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {stats.pendingReclamations} Urgent
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-blue-200 blur-3xl opacity-30" />
              <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-purple-200 blur-3xl opacity-30" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-indigo-100 blur-3xl opacity-30" />
            </div>

            <Spotlight className="relative">{renderContent()}</Spotlight>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Add this component at the bottom of the file or in _components/OwnerList.tsx if you prefer modularity
function OwnerList() {
  const [owners, setOwners] = useState<
    { id: string; name: string; email: string; stations: string[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOwners() {
      setLoading(true);
      try {
        // Fetch all stations directly
        const res = await fetch("http://localhost:5000/stations");
        const stations = res.ok ? await res.json() : [];

        // Group stations by owner using only station fields
        const ownersMap: Record<string, { id: string; name: string; email: string; stations: string[] }> = {};
        stations.forEach((station: any) => {
          const ownerKey = station.email || station.ownerId;
          if (!ownerKey) return;

          if (!ownersMap[ownerKey]) {
            ownersMap[ownerKey] = {
              id: ownerKey,
              name: station.ownerId || "Unknown Owner", // If you store name, use it here
              email: station.email,
              stations: [],
            };
          }
          ownersMap[ownerKey].stations.push(station.stationName || "Unnamed Station");
        });

        setOwners(Object.values(ownersMap));
      } catch (err) {
        console.error("Failed to fetch owners:", err);
        setOwners([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOwners();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading owners...</div>;
  }

  if (owners.length === 0) {
    return <div className="text-gray-500">No station owners found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {owners.map((owner) => (
        <Card key={owner.id} className="p-6">
          <div className="font-semibold text-gray-900">{owner.name}</div>
          <div className="text-sm text-gray-600 mb-2">{owner.email}</div>
          <div className="text-xs text-gray-500 mb-1">Stations:</div>
          <ul className="list-disc ml-5 text-sm text-gray-800">
            {owner.stations.length > 0 ? (
              owner.stations.map((station, idx) => <li key={idx}>{station}</li>)
            ) : (
              <li>No stations</li>
            )}
          </ul>
        </Card>
      ))}
    </div>
  );
}
