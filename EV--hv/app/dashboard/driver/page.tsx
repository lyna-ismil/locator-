"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { Car, Zap, User, Settings, Heart, Menu, X, Home, Search, Calendar, Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CarOwner, Station, Reservation } from "./types"
import OnboardingForm from "./_components/OnboardingForm"
import LocationPermission from "./_components/LocationPermission"
import StationDiscovery from "./_components/StationDiscovery"
import StationDetails from "./_components/StationDetails"
import ReservationFlow from "./_components/ReservationFlow"
import DriverDashboard from "./_components/DriverDashboard"

type DashboardView = "overview" | "discover" | "reservations" | "favorites" | "profile" | "settings"

const api = {
  updateProfile: async (id: string, form: Partial<CarOwner>) => {
    const res = await fetch(`http://localhost:5000/car-owners/profile/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) throw new Error("Profile update failed")
    return await res.json()
  },
  getStations: async (location: { lat: number; lng: number }, connectors: string[]) => {
    const res = await fetch(
      `http://localhost:5000/stations/nearby?lat=${location.lat}&lng=${location.lng}&connectors=${connectors.join(",")}`
    )
    if (!res.ok) throw new Error("Failed to fetch stations")
    return await res.json()
  },
  getFavorites: async (userId: string) => {
    const res = await fetch(`http://localhost:5000/car-owners/${userId}/favorites`)
    if (!res.ok) throw new Error("Failed to fetch favorites")
    return await res.json()
  },
  updateFavorites: async (userId: string, favorites: string[]) => {
    const res = await fetch(`http://localhost:5000/car-owners/${userId}/favorites`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites }),
    })
    if (!res.ok) throw new Error("Failed to update favorites")
    return await res.json()
  },
  createReservation: async (
    userId: string,
    carId: string,
    stationId: string,
    connectorId: string,
    startTime: string,
    endTime: string,
    paymentMethod: "Visa" | "OnSite"
  ) => {
    const res = await fetch("http://localhost:5000/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        carId,
        stationId,
        connectorId,
        startTime,
        endTime,
        paymentMethod,
      }),
    })
    if (!res.ok) throw new Error("Reservation failed")
    return await res.json()
  },
  getHistory: async (email: string): Promise<Reservation[]> => {
    const res = await fetch(`http://localhost:5000/reservations?email=${encodeURIComponent(email)}`)
    if (!res.ok) throw new Error("Failed to fetch history")
    return await res.json()
  },
}

export default function DriverPage() {
  const [user, setUser] = useState<CarOwner | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [reservationFlow, setReservationFlow] = useState<{
    station: Station
    chargerId: string
  } | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<DashboardView>("overview")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [isMobile, setIsMobile] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const [touchStartY, setTouchStartY] = useState(0)
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("driverUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Fetch favorites from backend when user changes
  useEffect(() => {
    if (user) {
      api.getFavorites(user.id).then(setFavorites).catch(() => setFavorites([]))
    }
  }, [user])

  // Fetch stations from backend when location changes (for StationDiscovery)
  const [stations, setStations] = useState<Station[]>([])
  useEffect(() => {
    if (location && user) {
      const connectors = [user.vehicleDetails.primaryConnector, ...(user.vehicleDetails.adapters || [])]
      api.getStations(location, connectors).then(setStations).catch(() => setStations([]))
    }
  }, [location, user])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      const viewport = document.querySelector('meta[name="viewport"]')
      if (!viewport) {
        const meta = document.createElement("meta")
        meta.name = "viewport"
        meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        document.head.appendChild(meta)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRefreshing(false)
    // Optionally re-fetch stations or dashboard data here
    if (location && user) {
      const connectors = [user.vehicleDetails.primaryConnector, ...(user.vehicleDetails.adapters || [])]
      api.getStations(location, connectors).then(setStations).catch(() => setStations([]))
    }
  }, [isRefreshing, location, user])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY
    const diff = touchY - touchStartY

    if (diff > 100 && window.scrollY === 0 && !isRefreshing) {
      handlePullToRefresh()
    }
  }

  const handleSwipe = (event: any, info: PanInfo) => {
    const { offset, velocity } = info

    if (Math.abs(velocity.x) > 500) {
      if (offset.x > 100) {
        setSwipeDirection("right")
        if (isMobile && !isMobileMenuOpen) {
          setIsMobileMenuOpen(true)
        }
      } else if (offset.x < -100) {
        setSwipeDirection("left")
        if (isMobile && isMobileMenuOpen) {
          setIsMobileMenuOpen(false)
        }
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case "1":
            setCurrentView("overview")
            break
          case "2":
            setCurrentView("discover")
            break
          case "3":
            setCurrentView("reservations")
            break
          case "4":
            setCurrentView("favorites")
            break
          case "5":
            setCurrentView("profile")
            break
          case "6":
            setCurrentView("settings")
            break
        }
      }

      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMobileMenuOpen])

  // Onboarding: POST to backend, save to localStorage
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-lime-500/5" />
        <OnboardingForm
          onComplete={async (formData) => {
            try {
              const savedOwner = await api.signUp(formData)
              setUser(savedOwner)
              localStorage.setItem("driverUser", JSON.stringify(savedOwner))
            } catch (err) {
              alert("Sign-up failed. Please try again.")
            }
          }}
        />
      </div>
    )
  }

  // Location permission
  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-lime-500/5" />
        <LocationPermission onLocation={setLocation} />
      </div>
    )
  }

  const navigationItems = [
    { id: "overview", label: "Overview", icon: Home, badge: null, shortcut: "Alt+1" },
    { id: "discover", label: "Discover", icon: Search, badge: null, shortcut: "Alt+2" },
    {
      id: "reservations",
      label: "Reservations",
      icon: Calendar,
      badge: notifications > 0 ? notifications : null,
      shortcut: "Alt+3",
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: Heart,
      badge: favorites.length > 0 ? favorites.length : null,
      shortcut: "Alt+4",
    },
    { id: "profile", label: "Profile", icon: User, badge: null, shortcut: "Alt+5" },
    { id: "settings", label: "Settings", icon: Settings, badge: null, shortcut: "Alt+6" },
  ]

  const Sidebar = () => (
    <motion.div
      initial={{ x: isMobile ? -300 : 0 }}
      animate={{ x: 0 }}
      exit={{ x: isMobile ? -300 : 0 }}
      drag={isMobile ? "x" : false}
      dragConstraints={{ left: -50, right: 0 }}
      onDragEnd={handleSwipe}
      className={`${isMobile ? "fixed inset-y-0 left-0 z-50 w-72" : "w-64"} bg-white border-r border-gray-200 shadow-lg ${isMobile ? "safe-area-inset-left" : ""}`}
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ChargeConnect</h2>
              <p className="text-sm text-gray-500">Driver Portal</p>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)} className="touch-manipulation">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-lime-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">{user.fullName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center mt-1">
                  <Car className="w-3 h-3 text-emerald-500 mr-1" />
                  <span className="text-xs text-emerald-600">
                    {user.vehicleDetails.make} {user.vehicleDetails.model}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <nav className="px-4 pb-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-12 touch-manipulation ${isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md" : "hover:bg-gray-100 text-gray-700"}`}
                onClick={() => {
                  setCurrentView(item.id as DashboardView)
                  if (isMobile) setIsMobileMenuOpen(false)
                  if (isMobile && "vibrate" in navigator) {
                    navigator.vibrate(10)
                  }
                }}
                title={item.shortcut}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </nav>

      {isMobile && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full touch-manipulation bg-transparent"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            Quick Actions
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showQuickActions ? "rotate-180" : ""}`} />
          </Button>
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2"
              >
                <Button variant="ghost" size="sm" className="w-full justify-start touch-manipulation">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start touch-manipulation">
                  <Search className="w-4 h-4 mr-2" />
                  Find Nearby
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )

  const MobileHeader = () => (
    <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-inset-top">
      {isRefreshing && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse" />}
      <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(true)} className="touch-manipulation">
        <Menu className="w-6 h-6" />
      </Button>
      <div className="flex items-center space-x-2">
        <Zap className="w-6 h-6 text-emerald-500" />
        <span className="font-semibold text-gray-900">ChargeConnect</span>
      </div>
      <Button variant="ghost" size="sm" className="touch-manipulation relative">
        <Bell className="w-5 h-5" />
        {notifications > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-red-500">{notifications}</Badge>
        )}
      </Button>
    </div>
  )

  const BottomNavigation = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-40">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navigationItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-16 touch-manipulation relative ${isActive ? "text-emerald-600" : "text-gray-600"}`}
              onClick={() => {
                setCurrentView(item.id as DashboardView)
                if ("vibrate" in navigator) {
                  navigator.vibrate(10)
                }
              }}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <Badge className="absolute top-1 right-2 w-4 h-4 p-0 text-xs bg-red-500">
                  {item.badge > 9 ? "9+" : item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )

  // Content rendering with backend data
  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return (
          <DriverDashboard
            user={user}
            favorites={favorites}
            setFavorites={async (newFavs) => {
              await api.updateFavorites(user.id, newFavs)
              setFavorites(newFavs)
            }}
          />
        )
      case "discover":
        return (
          <StationDiscovery
            user={user}
            location={location}
            stations={stations}
            onSelectStation={setSelectedStation}
            favorites={favorites}
            setFavorites={async (newFavs) => {
              await api.updateFavorites(user.id, newFavs)
              setFavorites(newFavs)
            }}
          />
        )
      case "reservations":
      case "favorites":
      case "profile":
      case "settings":
        return (
          <DriverDashboard
            user={user}
            favorites={favorites}
            setFavorites={async (newFavs) => {
              await api.updateFavorites(user.id, newFavs)
              setFavorites(newFavs)
            }}
          />
        )
      default:
        return (
          <DriverDashboard
            user={user}
            favorites={favorites}
            setFavorites={async (newFavs) => {
              await api.updateFavorites(user.id, newFavs)
              setFavorites(newFavs)
            }}
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
            transition={{ duration: 0.3 }}
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

      <Button
        onClick={() => {
          localStorage.removeItem("driverUser")
          setUser(null)
        }}
      >
        Log Out
      </Button>
    </div>
  )
}
