"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Car, Zap, User, Settings, Heart, Home, Search, Calendar, Bell, Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import OnboardingForm from "./_components/OnboardingForm"
import DriverDashboard from "./_components/DriverDashboard"
import StationDetails from "./_components/StationDetails"
import ReservationFlow from "./_components/ReservationFlow"
import LocationPermission from "./_components/LocationPermission"
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
import type { CarOwner, Station } from "./types"

/* ---------- GENERIC LOADING COMPONENT ---------- */
const LoadingState = ({ message }: { message: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

const StationDiscovery = dynamic(() => import("./_components/StationDiscovery"), {
  ssr: false,
  loading: () => <LoadingState message="Loading station discovery..." />,
})

type DashboardView = "overview" | "discover" | "reservations" | "favorites" | "profile" | "settings"

/* ---------- API HELPERS ---------- */
const api = {
  updateProfile: async (id: string, form: Partial<CarOwner>) => {
    const res = await fetch(`http://localhost:5000/car-owners/profile/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) throw new Error("Profile update failed")
    return res.json()
  },
  getFavorites: async (userId: string) => {
    const res = await fetch(`http://localhost:5000/car-owners/${userId}/favorites`)
    if (!res.ok) throw new Error("Failed to fetch favorites")
    return res.json()
  },
  updateFavorites: async (userId: string, favorites: string[]) => {
    const res = await fetch(`http://localhost:5000/car-owners/${userId}/favorites`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites }),
    })
    if (!res.ok) throw new Error("Failed to update favorites")
    return res.json()
  },
}

/* ---------- NORMALIZERS & CHECKS ---------- */
function normalizeUser(raw: any): CarOwner | null {
  if (!raw) return null
  const base = raw.user || raw
  const id = base.id || base._id
  return {
    id,
    _id: base._id || id,
    fullName: base.fullName || "",
    email: base.email || "",
    vehicleDetails:
      base.vehicleDetails ||
      base.vehicle || {
        make: "",
        model: "",
        primaryConnector: "",
        adapters: [],
      },
    preferences: base.preferences || { preferredNetworks: [], requiredAmenities: [] },
  } as CarOwner
}

function isProfileComplete(u: CarOwner) {
  return (
    !!u.fullName &&
    !!u.email &&
    !!u.vehicleDetails?.make &&
    !!u.vehicleDetails?.model &&
    !!u.vehicleDetails?.primaryConnector
  )
}

/* ---------- COMPONENT ---------- */
export default function DriverPage() {
  const [user, setUser] = useState<CarOwner | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationPending, setLocationPending] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [favorites, setFavorites] = useState<string[]>([])

  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [reservationFlow, setReservationFlow] = useState<{ station: Station; chargerId: string } | null>(null)
  const [currentView, setCurrentView] = useState<DashboardView>("overview")

  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const GATEWAY_BASE = (process.env.NEXT_PUBLIC_GATEWAY_BASE || "http://localhost:3001").replace(/\/$/, "")

  /* ---------- LOAD USER ---------- */
  useEffect(() => {
    const run = async () => {
      try {
        const cached = localStorage.getItem("driverUser")
        if (cached) {
          const parsed = normalizeUser(JSON.parse(cached))
            if (parsed) {
              setUser(parsed)
              setLoadingUser(false)
              return
            }
        }
        const id = localStorage.getItem("driverUserId")
        if (!id) {
          setLoadingUser(false)
          return
        }
        let res = await fetch(`http://localhost:5000/car-owners/profile/${id}`)
        if (!res.ok) {
          const alt = await fetch(`http://localhost:5000/car-owners/${id}`)
          if (alt.ok) res = alt
          else throw new Error(`Profile fetch failed status=${res.status}`)
        }
        const data = await res.json()
        const normalized = normalizeUser(data)
        if (!normalized?.id) throw new Error("No id in profile response")
        setUser(normalized)
        localStorage.setItem("driverUser", JSON.stringify(normalized))
      } catch (e) {
        console.warn("Driver profile load error:", e)
      } finally {
        setLoadingUser(false)
      }
    }
    run()
  }, [])

  /* ---------- REDIRECT IF NO USER ---------- */
  useEffect(() => {
    if (!loadingUser && !user) {
      const hasId = localStorage.getItem("driverUserId")
      if (!hasId) {
        window.location.href = "/sign-in"
      }
    }
  }, [loadingUser, user])

  /* ---------- FAVORITES ---------- */
  useEffect(() => {
    if (!user?.id) return
    api
      .getFavorites(user.id)
      .then((f) => setFavorites(Array.isArray(f) ? f : []))
      .catch(() => setFavorites([]))
  }, [user?.id])

  /* ---------- MOBILE DETECTION ---------- */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement("meta")
        meta.name = "viewport"
        meta.content = "width=device-width, initial-scale=1.0"
        document.head.appendChild(meta)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  /* ---------- NOTIFICATIONS ---------- */
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoadingNotifications(true)
      const res = await fetch(`${GATEWAY_BASE}/api/notifications?userId=${encodeURIComponent(user.id)}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error("Notifications fetch failed:", e)
    } finally {
      setLoadingNotifications(false)
    }
  }, [user?.id, GATEWAY_BASE])

  useEffect(() => {
    fetchNotifications()
    if (!user?.id) return
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications, user?.id])

  async function markNotificationRead(id: string) {
    try {
      await fetch(`${GATEWAY_BASE}/api/notifications/${id}/read`, { method: "PATCH" })
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n)))
    } catch (e) {
      console.error("Mark read failed:", e)
    }
  }

  async function markAllNotificationsRead() {
    if (!user?.id) return
    try {
      await fetch(`${GATEWAY_BASE}/api/notifications/mark-all-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
    } catch (e) {
      console.error("Mark all read failed:", e)
    }
  }

  const unreadCount = notifications.filter((n) => !(n.read ?? n.isRead)).length

  /* ---------- LOADING STATES ---------- */
  if (loadingUser) {
    return <LoadingState message="Loading your profile..." />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600 mb-4">Unable to load your profile. Please log in again.</div>
        <Button
          onClick={() => {
            localStorage.removeItem("driverUser")
            localStorage.removeItem("driverUserId")
            window.location.href = "/sign-in"
          }}
          className="bg-emerald-600 text-white px-6"
        >
          Go to Sign In
        </Button>
      </div>
    )
  }

  /* ---------- ONBOARDING ---------- */
  if (!isProfileComplete(user)) {
    return (
      <OnboardingForm
        initialData={user}
        onComplete={async (formData) => {
          try {
            const res = await api.updateProfile(user.id, {
              fullName: formData.fullName,
              vehicleDetails: formData.vehicleDetails,
            })
            const updated = normalizeUser(res.user || res)
            if (updated) {
              setUser(updated)
              localStorage.setItem("driverUser", JSON.stringify(updated))
            }
          } catch {
            alert("Profile update failed. Please try again.")
          }
        }}
      />
    )
  }

  /* ---------- LOCATION PERMISSION GATE ---------- */
  if (!location) {
    return (
      <LocationPermission
        onLocation={(loc) => {
          setLocation(loc)
          setLocationPending(false)
        }}
        onRequest={() => {
          setLocationPending(true)
          setLocationError(null)
        }}
        onError={(msg: string) => {
          setLocationPending(false)
          setLocationError(msg || "Unable to get location.")
        }}
      >
        {locationPending ? (
          <LoadingState message="Loading your location..." />
        ) : locationError ? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
            <p className="text-sm text-red-600">{locationError}</p>
            <Button onClick={() => setLocationPending(true)} size="sm">
              Retry
            </Button>
          </div>
        ) : null}
      </LocationPermission>
    )
  }

  /* ---------- NAV ITEMS ---------- */
  const navigationItems = [
    { id: "overview", label: "Overview", icon: Home, badge: null, shortcut: "Alt+1" },
    { id: "discover", label: "Discover", icon: Search, badge: null, shortcut: "Alt+2" },
    { id: "reservations", label: "Reservations", icon: Calendar, badge: null, shortcut: "Alt+3" },
    { id: "favorites", label: "Favorites", icon: Heart, badge: favorites.length || null, shortcut: "Alt+4" },
    { id: "profile", label: "Profile", icon: User, badge: null, shortcut: "Alt+5" },
    { id: "settings", label: "Settings", icon: Settings, badge: null, shortcut: "Alt+6" },
  ] as const

  /* ---------- CONTENT RENDERER ---------- */
  const renderContent = () => {
    const safeUpdateFavorites = async (newFavs: string[]) => {
      if (!user?.id) return
      try {
        await api.updateFavorites(user.id, newFavs)
        setFavorites(newFavs)
      } catch {}
    }
    if (currentView === "discover") {
      return (
        <StationDiscovery
          user={user}
          location={location}
          onSelectStation={setSelectedStation}
          favorites={favorites}
          setFavorites={safeUpdateFavorites}
        />
      )
    }
    return (
      <DriverDashboard
        user={user}
        favorites={favorites}
        setFavorites={safeUpdateFavorites}
        activeView={currentView}
        setActiveView={setCurrentView}
      />
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 via-lime-500 to-emerald-600 grid place-items-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900">ChargeConnect</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Driver Portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <div className="mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-lime-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 grid place-items-center text-white font-bold text-lg">
                    {user?.fullName?.charAt(0) || "D"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user?.fullName || "Driver"}</div>
                    <div className="text-sm text-gray-600">Premium Account</div>
                  </div>
                </div>
                {user?.vehicleDetails?.make && (
                  <div className="flex items-center">
                    <Car className="w-4 h-4 text-emerald-600 mr-2" />
                    <span className="text-sm text-emerald-700 font-medium">
                      {user.vehicleDetails.make} {user.vehicleDetails.model}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => setCurrentView(item.id as DashboardView)}
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
              onClick={() => {
                localStorage.removeItem("driverUser")
                localStorage.removeItem("driverUserId")
                setUser(null)
                window.location.href = "/sign-in"
              }}
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
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative"
                    onClick={() => setShowNotifications((p) => !p)}
                  >
                    <Bell className="w-4 h-4" />
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-[10px] justify-center bg-red-600 text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="relative"
            >
              {renderContent()}
            </motion.div>
          </div>
        </SidebarInset>
      </div>

      {/* Modals / Overlays */}
      <AnimatePresence>
        {selectedStation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
            <StationDetails
              station={selectedStation}
              user={user}
              onReserve={(chargerId: string) => {
                setReservationFlow({ station: selectedStation, chargerId })
                setSelectedStation(null)
              }}
              onClose={() => setSelectedStation(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reservationFlow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
            <ReservationFlow
              station={reservationFlow.station}
              chargerId={reservationFlow.chargerId}
              user={user}
              onComplete={() => setReservationFlow(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-16 right-4 z-50 w-full max-w-sm"
          >
            <Card className="shadow-2xl border border-gray-200">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Notifications</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unreadCount === 0}
                      onClick={markAllNotificationsRead}
                      className="text-xs bg-transparent"
                    >
                      Mark all
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => fetchNotifications()}>
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto space-y-2">
                {loadingNotifications && <div className="text-xs text-gray-500">Loading...</div>}
                {!loadingNotifications && notifications.length === 0 && (
                  <div className="text-xs text-gray-500">No notifications.</div>
                )}
                {notifications.map((n) => {
                  const unread = !(n.read ?? n.isRead)
                  return (
                    <div
                      key={n._id}
                      className={`p-3 rounded-lg border text-sm ${
                        unread ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="font-medium text-gray-800">{n.title || n.type || "Notification"}</div>
                      {n.message || n.body ? (
                        <div className="text-xs text-gray-600 mt-0.5">{n.message || n.body}</div>
                      ) : null}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                        </span>
                        {unread && (
                          <Button
                            size="sm"
                            variant="link"
                            className="h-auto p-0 text-[11px] text-emerald-600"
                            onClick={() => markNotificationRead(n._id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarProvider>
  )
}