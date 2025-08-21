"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { Car, Zap, User, Settings, Heart, Menu, X, Home, Search, Calendar, Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import OnboardingForm from "./_components/OnboardingForm"
import DriverDashboard from "./_components/DriverDashboard"
import StationDetails from "./_components/StationDetails"
import ReservationFlow from "./_components/ReservationFlow"

import type { CarOwner, Station } from "./types" // ensure types file exports these

const StationDiscovery = dynamic(() => import("./_components/StationDiscovery"), { ssr: false })

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
  getStations: async (location: { lat: number; lng: number }, connectors: string[]) => {
    const qs = connectors.filter(Boolean).join(",")
    const res = await fetch(
      `http://localhost:5000/stations/nearby?lat=${location.lat}&lng=${location.lng}&connectors=${encodeURIComponent(qs)}`,
    )
    if (!res.ok) throw new Error("Failed to fetch stations")
    return res.json()
  },
  getFavorites: async (userId: string) => {
    // If backend route not implemented this will 404; we catch caller side.
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
    _id: base._id || id, // keep both if types allow
    fullName: base.fullName || "",
    email: base.email || "",
    vehicleDetails: base.vehicleDetails ||
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
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [stations, setStations] = useState<Station[]>([])
  const [favorites, setFavorites] = useState<string[]>([])

  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [reservationFlow, setReservationFlow] = useState<{ station: Station; chargerId: string } | null>(null)
  const [currentView, setCurrentView] = useState<DashboardView>("overview")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [touchStartY, setTouchStartY] = useState(0)
  const [showQuickActions, setShowQuickActions] = useState(false)

  /* ---------- LOAD USER (LOCAL then API) ---------- */
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
        // Correct route: /car-owners/profile/:id
        let res = await fetch(`http://localhost:5000/car-owners/profile/${id}`)
        if (!res.ok) {
          // fallback if you later add /car-owners/:id
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

  /* ---------- REDIRECT IF NO USER AFTER LOAD ---------- */
  useEffect(() => {
    if (!loadingUser && !user) {
      const hasId = localStorage.getItem("driverUserId")
      if (!hasId) {
        window.location.href = "/sign-in"
      }
    }
  }, [loadingUser, user])

  /* ---------- GEOLOCATION (after profile complete or during discovery) ---------- */
  useEffect(() => {
    if (!user) return
    if (!navigator.geolocation) {
      setLocation({ lat: 36.8065, lng: 10.1815 })
      setLoadingLocation(false)
      return
    }
    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoadingLocation(false)
      },
      () => {
        setLocation({ lat: 36.8065, lng: 10.1815 })
        setLoadingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [user])

  /* ---------- FAVORITES (guard if backend route missing) ---------- */
  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    api
      .getFavorites(uid)
      .then((f) => setFavorites(Array.isArray(f) ? f : []))
      .catch(() => setFavorites([])) // swallow if route not ready
  }, [user])

  /* ---------- STATIONS ---------- */
  useEffect(() => {
    if (!location || !user) return
    const connectors = [user.vehicleDetails?.primaryConnector, ...(user.vehicleDetails?.adapters || [])].filter(
      Boolean,
    ) as string[]
    if (connectors.length === 0) return
    api
      .getStations(location, connectors)
      .then(setStations)
      .catch(() => setStations([]))
  }, [location, user])

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

  /* ---------- REFRESH (PULL) ---------- */
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsRefreshing(false)
    if (location && user) {
      const connectors = [user.vehicleDetails?.primaryConnector, ...(user.vehicleDetails?.adapters || [])].filter(
        Boolean,
      ) as string[]
      if (connectors.length) {
        api
          .getStations(location, connectors)
          .then(setStations)
          .catch(() => {})
      }
    }
  }, [isRefreshing, location, user])

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartY(e.touches[0].clientY)
  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - touchStartY
    if (diff > 100 && window.scrollY === 0 && !isRefreshing) handlePullToRefresh()
  }

  /* ---------- SWIPE MENU ---------- */
  const handleSwipe = (event: any, info: PanInfo) => {
    const { offset, velocity } = info
    if (Math.abs(velocity.x) > 500) {
      if (offset.x > 100 && isMobile && !isMobileMenuOpen) setIsMobileMenuOpen(true)
      else if (offset.x < -100 && isMobile && isMobileMenuOpen) setIsMobileMenuOpen(false)
    }
  }

  /* ---------- KEYBOARD SHORTCUTS ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey) {
        const keyMap: Record<string, DashboardView> = {
          "1": "overview",
          "2": "discover",
          "3": "reservations",
          "4": "favorites",
          "5": "profile",
          "6": "settings",
        }
        if (keyMap[e.key]) setCurrentView(keyMap[e.key])
      }
      if (e.key === "Escape" && isMobileMenuOpen) setIsMobileMenuOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isMobileMenuOpen])

  /* ---------- LOADING & ERROR STATES ---------- */
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading your profile...</div>
      </div>
    )
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

  /* ---------- ONBOARDING WHEN INCOMPLETE ---------- */
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

  /* ---------- NAV ITEMS ---------- */
  const navigationItems = [
    { id: "overview", label: "Overview", icon: Home, badge: null, shortcut: "Alt+1" },
    { id: "discover", label: "Discover", icon: Search, badge: null, shortcut: "Alt+2" },
    { id: "reservations", label: "Reservations", icon: Calendar, badge: null, shortcut: "Alt+3" },
    { id: "favorites", label: "Favorites", icon: Heart, badge: favorites.length || null, shortcut: "Alt+4" },
    { id: "profile", label: "Profile", icon: User, badge: null, shortcut: "Alt+5" },
    { id: "settings", label: "Settings", icon: Settings, badge: null, shortcut: "Alt+6" },
  ] as const

  const Sidebar = () => (
    <motion.div
      initial={{ x: isMobile ? -300 : 0 }}
      animate={{ x: 0 }}
      exit={{ x: isMobile ? -300 : 0 }}
      drag={isMobile ? "x" : false}
      dragConstraints={{ left: -50, right: 0 }}
      onDragEnd={handleSwipe}
      className={`${isMobile ? "fixed inset-y-0 left-0 z-50 w-72" : "w-64"} bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-xl`}
    >
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-lime-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">ChargeConnect</h2>
              <p className="text-white/80 text-sm font-medium">Driver Portal</p>
            </div>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <Card className="bg-gradient-to-br from-emerald-50 via-lime-50 to-green-50 border-emerald-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">{user.fullName.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm">{user.fullName}</p>
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                {user.vehicleDetails?.make && (
                  <div className="flex items-center mt-1.5">
                    <Car className="w-3 h-3 text-emerald-600 mr-1" />
                    <span className="text-xs text-emerald-700 font-medium">
                      {user.vehicleDetails.make} {user.vehicleDetails.model}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <nav className="px-4 pb-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start h-12 transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700 hover:text-gray-900 hover:shadow-sm"
              }`}
              onClick={() => {
                setCurrentView(item.id as DashboardView)
                if (isMobile) setIsMobileMenuOpen(false)
                if (isMobile && "vibrate" in navigator) navigator.vibrate(10)
              }}
              title={item.shortcut}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-white" : "text-gray-500"}`} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {!!item.badge && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className={`ml-auto text-xs ${
                    isActive
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-center mb-4">
          <div className="bg-emerald-50 rounded-lg p-2">
            <div className="text-lg font-bold text-emerald-600">{favorites.length}</div>
            <div className="text-xs text-emerald-700">Favorites</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="text-lg font-bold text-blue-600">{stations.length}</div>
            <div className="text-xs text-blue-700">Nearby</div>
          </div>
        </div>
        <Button
          onClick={() => {
            localStorage.removeItem("driverUser")
            localStorage.removeItem("driverUserId")
            setUser(null)
            window.location.href = "/sign-in"
          }}
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
        >
          Log Out
        </Button>
      </div>
    </motion.div>
  )

  const MobileHeader = () => (
    <div className="md:hidden bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-3 flex items-center justify-between shadow-lg">
      {isRefreshing && <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 animate-pulse" />}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileMenuOpen(true)}
        className="text-white hover:bg-white/20"
      >
        <Menu className="w-6 h-6" />
      </Button>
      <div className="flex items-center space-x-2">
        <Zap className="w-6 h-6 text-white" />
        <span className="font-bold text-white">ChargeConnect</span>
      </div>
      <Button variant="ghost" size="sm" className="relative text-white hover:bg-white/20">
        <Bell className="w-5 h-5" />
        {notifications > 0 && (
          <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs bg-red-500 text-white">
            {notifications > 9 ? "9+" : notifications}
          </Badge>
        )}
      </Button>
    </div>
  )

  const BottomNavigation = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40 shadow-lg">
      <div className="grid grid-cols-4 gap-1 p-2">
        {["overview", "discover", "reservations", "favorites"].map((id) => {
          const item = navigationItems.find((n) => n.id === id)!
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center h-16 transition-all duration-200 ${
                isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              onClick={() => {
                setCurrentView(item.id as DashboardView)
                if ("vibrate" in navigator) navigator.vibrate(10)
              }}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-emerald-600" : "text-gray-500"}`} />
              <span className={`text-xs font-medium ${isActive ? "text-emerald-600" : "text-gray-600"}`}>
                {item.label}
              </span>
              {!!item.badge && (
                <Badge className="absolute top-1 right-2 w-4 h-4 p-0 text-xs bg-red-500 text-white">
                  {Number(item.badge) > 9 ? "9+" : item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )

  const renderContent = () => {
    const safeUpdateFavorites = async (newFavs: string[]) => {
      if (!user?.id) return
      try {
        await api.updateFavorites(user.id, newFavs)
        setFavorites(newFavs)
      } catch {}
    }
    switch (currentView) {
      case "discover":
        if (loadingLocation) {
          return (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
              <p className="text-lg font-medium">Finding your location...</p>
              <p className="text-sm text-gray-500">Please wait while we pinpoint your position.</p>
            </div>
          )
        }
        return (
          <StationDiscovery
            user={user}
            location={location}
            stations={stations}
            onSelectStation={setSelectedStation}
            favorites={favorites}
            setFavorites={safeUpdateFavorites}
          />
        )
      default:
        return (
          <DriverDashboard
            user={user}
            favorites={favorites}
            setFavorites={safeUpdateFavorites}
            stations={stations} // <- PASS stations array here
          />
        )
    }
  }

  return (
    <div
      className="h-screen bg-gray-50 flex overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{(!isMobile || isMobileMenuOpen) && <Sidebar />}</AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader />
        <main className={`flex-1 overflow-auto ${isMobile ? "pb-20" : ""}`}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleSwipe}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>

      {isMobile && <BottomNavigation />}

      <AnimatePresence>
        {selectedStation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <ReservationFlow
              station={reservationFlow.station}
              chargerId={reservationFlow.chargerId}
              user={user}
              onComplete={() => setReservationFlow(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
