"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  Heart,
  AlertTriangle,
  Star,
  User,
  Settings,
  Car,
  CreditCard,
  Bell,
  Shield,
  Edit3,
  Camera,
  MapPin,
  Zap,
  TrendingUp,
} from "lucide-react"
import { CONNECTOR_TYPES, type ConnectorType, type VehicleDetails, type Reservation, type Reclamation } from "../types"

// FALLBACK: ensure we always have a connector list at runtime
const DEFAULT_CONNECTORS = ["TYPE1", "TYPE2", "CHAdeMO", "CCS", "TESLA", "GB/T"]
const CONNECTORS: string[] = Array.isArray(CONNECTOR_TYPES) ? (CONNECTOR_TYPES as string[]) : DEFAULT_CONNECTORS

const BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")

const api = {
  getHistory: async (email: string, userId?: string, timeoutMs = 7000): Promise<Reservation[]> => {
    const qsEmail = encodeURIComponent(email)
    const qsUserId = userId ? encodeURIComponent(userId) : ""
    // Probe multiple possible service endpoints (adjust as your services evolve)
    const endpoints: string[] = [
      `${BASE}/sessions?email=${qsEmail}`,
      `${BASE}/sessions?userEmail=${qsEmail}`,
      `${BASE}/charging-sessions?email=${qsEmail}`,
      `${BASE}/charging-sessions?userEmail=${qsEmail}`,
      userId ? `${BASE}/charging-sessions?userId=${qsUserId}` : "",
      userId ? `${BASE}/sessions?userId=${qsUserId}` : "",
      `${BASE}/sessions/history?email=${qsEmail}`,
    ].filter(Boolean)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const tryFetch = async (url: string) => {
      try {
        const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } })
        if (!res.ok) {
          // Treat 404/204 as empty (skip)
          if (res.status === 404 || res.status === 204) return null
          return null
        }
        const text = await res.text()
        if (!text) return null
        try {
          return JSON.parse(text)
        } catch {
          return null
        }
      } catch (e: any) {
        if (e?.name === "AbortError") throw e
        return null
      }
    }

    let data: any = null
    for (const url of endpoints) {
      data = await tryFetch(url)
      if (data) {
        break
      }
    }

    clearTimeout(timeout)

    if (!data) {
      // Graceful fallback: no data -> empty history
      console.warn("[getHistory] No session payload from probed endpoints; returning empty []")
      return []
    }

    const rawSessions: any[] = Array.isArray(data) ? data : data.sessions || data.items || data.data || []
    if (!Array.isArray(rawSessions) || rawSessions.length === 0) return []

    return rawSessions.map((s: any) => ({
      id: s._id || s.id || s.sessionId || `${s.stationId || "station"}-${s.chargerId || "charger"}-${s.date || s.createdAt || Date.now()}`,
      stationId: s.stationName || s.station?.name || s.stationId || s.relatedStation || "Unknown Station",
      chargerId: s.chargerId || s.connectorId || s.charger?.id || "",
      expiresAt: s.expiresAt || s.endTime || s.updatedAt || s.createdAt || new Date().toISOString(),
      paymentMethod: s.paymentMethod || s.payment?.method || "OnSite",
      status: s.status || "completed",
      cost: typeof s.cost === "number" ? s.cost : Number.parseFloat(s.price || 0) || 0,
      duration: s.duration || s.minutes || 0,
      energyDelivered: s.energyDelivered || s.energy || s.kwh || 0,
      date:
        s.date ||
        (s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
    }))
  },

  // keep other api methods unchanged
  submitReclamation: async (data: Reclamation) => {
    const res = await fetch(`${BASE}/reclamations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to submit reclamation")
    return await res.json()
  },
  postReview: async (stationId: string, review: any) => {
    const res = await fetch(`${BASE}/stations/${stationId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    })
    if (!res.ok) throw new Error("Failed to submit review")
    return await res.json()
  },
  updateProfile: async (userId: string, data: any) => {
    const res = await fetch(`${BASE}/car-owners/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update profile")
    return await res.json()
  },
  getFavorites: async (userId: string): Promise<string[]> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(`${BASE}/car-owners/${userId}/favorites`, { signal: controller.signal })
      if (res.status === 404) return []
      if (!res.ok) {
        console.warn("[getFavorites] non-OK response:", res.status)
        return []
      }
      const data = await res.json()
      if (Array.isArray(data)) return data
      if (Array.isArray((data as any).favorites)) return (data as any).favorites
      return []
    } catch (e: any) {
      if (e?.name !== "AbortError") console.warn("[getFavorites] fetch failed:", e)
      return []
    } finally {
      clearTimeout(timeout)
    }
  },
  updateFavorites: async (userId: string, favorites: string[]) => {
    const res = await fetch(`${BASE}/car-owners/${userId}/favorites`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites }),
    })
    if (!res.ok) throw new Error("Failed to update favorites")
    return await res.json()
  },
}

// Optional: stronger typing for editable profile
interface EditableProfile {
  fullName: string
  email: string
  phone?: string
  location?: string
  photoUrl?: string | null
  vehicleDetails: {
    id?: string
    make: string
    model: string
    year?: number
    batteryCapacityKWh?: number
    maxChargingSpeed?: number
    primaryConnector: string
    adapters: string[]
  }
  preferences: {
    preferredNetworks: string[]
    requiredAmenities: string[]
  }
}

export default function DriverDashboard({
  user,
  favorites,
  setFavorites,
  stations = [],
  activeView,
  setActiveView,
}: {
  user: any
  favorites: string[]
  setFavorites: (ids: string[]) => void
  stations?: { _id: string; stationName?: string; address?: any }[]
  activeView: string
  setActiveView: (view: string) => void
}) {
  const [history, setHistory] = useState<Reservation[]>([])
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reclamationForm, setReclamationForm] = useState({
    stationId: "",
    title: "",
    category: "General Feedback",
    description: "",
  })
  const [editingProfile, setEditingProfile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // Unified editable profile state (personal + vehicle + preferences)
  const [editableProfile, setEditableProfile] = useState<EditableProfile>({
    fullName: user.fullName || "",
    email: user.email || "",
    phone: (user.phone as string) || "+216 12 345 678",
    location: (user.location as string) || "Tunis, Tunisia",
    photoUrl: user.photoUrl || null,
    vehicleDetails: {
      id: user.vehicleDetails?.id,
      make: user.vehicleDetails?.make || "",
      model: user.vehicleDetails?.model || "",
      year: user.vehicleDetails?.year,
      batteryCapacityKWh: user.vehicleDetails?.batteryCapacityKWh,
      maxChargingSpeed: user.vehicleDetails?.maxChargingSpeed,
      primaryConnector: (user.vehicleDetails?.primaryConnector ||
        (user.vehicle?.primaryConnector as string) ||
        "CCS"),
      adapters:
        user.vehicleDetails?.adapters ||
        (user.vehicle?.adapters as string[]) ||
        [],
    },
    preferences: {
      preferredNetworks: user.preferences?.preferredNetworks || [],
      requiredAmenities: user.preferences?.requiredAmenities || [],
    },
  })
  const [settings, setSettings] = useState({
    notifications: {
      chargingComplete: true,
      reservationReminders: true,
      promotions: false,
      weeklyReports: true,
    },
    privacy: {
      shareLocation: true,
      shareChargingData: false,
      publicProfile: false,
    },
    preferences: {
      language: "en",
      currency: "TND",
      theme: "light",
      autoReserve: false,
    },
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    api.getHistory(user.email, user.id).then(setHistory)
    api.getFavorites(user.id).then(setFavorites)
  }, [user.email, user.id])

  const totalSessions = history.length
  const totalCost = history.reduce((sum, session) => sum + (session.cost || 0), 0)
  const totalEnergy = history.reduce((sum, session) => sum + (session.energyDelivered || 0), 0)
  const avgRating = 4.7 // Mock average rating

  async function handleReclamationSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reclamationForm.title || !reclamationForm.description || !reclamationForm.stationId) {
      alert("Please select a station and fill out all fields.")
      return
    }

    try {
      const newReclamation = {
        submittedBy: user.id, // backend expects user id
        relatedStation: reclamationForm.stationId, // station identifier
        category: reclamationForm.category,
        title: reclamationForm.title,
        description: reclamationForm.description,
        status: "Open",
        createdAt: new Date().toISOString(),
      }

      const saved = await api.submitReclamation(newReclamation)
      // append saved reclamation returned by backend (or fallback to local object)
      setReclamations((prev) => [...prev, saved || newReclamation])

      // reset form
      setReclamationForm({ stationId: "", title: "", category: "General Feedback", description: "" })
    } catch (err) {
      console.error("Failed to submit reclamation", err)
      alert("Failed to submit report. Please try again.")
    }
  }

  function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    api.postReview("station1", {
      user: user.fullName,
      rating: reviewRating,
      text: reviewText,
      date: new Date().toISOString(),
    })
    setReviewText("")
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditableProfile(p => ({ ...p, photoUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Single save for the whole editable profile
  async function handleProfileSave() {
    if (!user?.id) {
      alert("User ID not found, please log in again.")
      return
    }
    try {
     // Build minimal diff payload
     const base = {
       fullName: editableProfile.fullName,
       vehicleDetails: editableProfile.vehicleDetails,
       preferences: editableProfile.preferences,
     } as any
     if (editableProfile.email && editableProfile.email !== user.email) base.email = editableProfile.email
     if (editableProfile.photoUrl && editableProfile.photoUrl !== user.photoUrl) base.photoUrl = editableProfile.photoUrl

     await api.updateProfile(user.id, base)
      setEditingProfile(false)
      try {
       const merged = { ...user, ...base }
        localStorage.setItem("driverUser", JSON.stringify(merged))
      } catch {}
    } catch (err) {
      console.error("Failed to update profile", err)
      alert("Failed to save changes. Please try again.")
    }
  }

  function handleSettingsChange<Category extends keyof typeof settings>(
    category: Category,
    key: keyof (typeof settings)[Category],
    value: any,
  ) {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  async function handleSaveSettings() {
    if (!user?.id) {
      alert("User ID not found. Please log in again.")
      return
    }
    try {
      setSavingSettings(true)
      // Persist only the user-facing preferences subset to backend (adjust schema if you want notifications/privacy saved too)
      await api.updateProfile(user.id, {
        preferences: {
          ...editableProfile.preferences,
          ui: {
            language: settings.preferences.language,
            currency: settings.preferences.currency,
            theme: settings.preferences.theme,
            autoReserve: settings.preferences.autoReserve,
          },
        },
      })
      alert("Settings saved successfully!")
    } catch (err) {
      console.error("Failed to save settings", err)
      alert("Failed to save settings. Please try again.")
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeView === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-emerald-500 via-lime-500 to-green-500 rounded-2xl p-8 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-3">Welcome back, {user.fullName.split(" ")[0]}!</h2>
                      <p className="text-white/90 text-lg mb-4">
                        You've saved <span className="font-semibold">{totalCost.toFixed(2)} TND</span> on{" "}
                        <span className="font-semibold">{totalSessions}</span> charging sessions
                      </p>
                      <div className="flex items-center space-x-4 text-white/80">
                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm">{totalEnergy.toFixed(1)} kWh consumed</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span className="text-sm">{avgRating} avg rating</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold mb-1">{totalSessions}</div>
                      <div className="text-white/80 text-sm font-medium">Total Sessions</div>
                      <div className="mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">Active Driver</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{totalEnergy.toFixed(1)} kWh</div>
                      <div className="text-sm text-gray-600 font-medium">Energy Consumed</div>
                      <div className="text-xs text-emerald-600 mt-1">+12% this month</div>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{totalCost.toFixed(2)} TND</div>
                      <div className="text-sm text-gray-600 font-medium">Total Spent</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Avg: {(totalCost / totalSessions || 0).toFixed(1)} TND/session
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{favorites.length}</div>
                      <div className="text-sm text-gray-600 font-medium">Favorite Stations</div>
                      <div className="text-xs text-orange-600 mt-1">Quick access saved</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-md border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <span className="text-xl font-semibold">Recent Activity</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-transparent"
                      >
                        View All
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {history.slice(0, 3).map((session, index) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-emerald-50 hover:to-lime-50 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-lime-100 rounded-full flex items-center justify-center">
                              <Zap className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{session.stationId}</div>
                              <div className="text-sm text-gray-600 flex items-center space-x-3">
                                <span>{session.energyDelivered}kWh</span>
                                <span>•</span>
                                <span>{session.duration}min</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {session.paymentMethod}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 text-lg">{session.cost} TND</div>
                            <div className="text-sm text-gray-600">{session.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {activeView === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                {/* Profile Header */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        {editableProfile.photoUrl ? (
                          <img
                            src={editableProfile.photoUrl}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.fullName || "User",
                            )}&background=random`}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">{editableProfile.fullName}</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (editingProfile) {
                                // cancel: reset to original snapshot
                                setEditableProfile({
                                  fullName: user.fullName || "",
                                  email: user.email || "",
                                  phone: user.phone || "+216 12 345 678",
                                  location: user.location || "Tunis, Tunisia",
                                  photoUrl: user.photoUrl || null,
                                  vehicleDetails:
                                    user.vehicleDetails || {
                                      make: "",
                                      model: "",
                                      year: undefined,
                                      primaryConnector: "CCS",
                                      adapters: [],
                                      maxChargingSpeed: undefined,
                                    },
                                  preferences: user.preferences || {
                                    preferredNetworks: [],
                                    requiredAmenities: [],
                                  },
                                })
                              }
                              setEditingProfile(!editingProfile)
                            }}
                            className="flex items-center space-x-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>{editingProfile ? "Cancel" : "Edit Profile"}</span>
                          </Button>
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{editableProfile.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4" />
                            <span>
                              {editableProfile.vehicleDetails?.make} {editableProfile.vehicleDetails?.model}{" "}
                              {editableProfile.vehicleDetails?.year && `(${editableProfile.vehicleDetails.year})`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={editableProfile.fullName}
                          onChange={(e) => setEditableProfile((p: any) => ({ ...p, fullName: e.target.value }))}
                          disabled={!editingProfile}
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editableProfile.email}
                          onChange={(e) => setEditableProfile((p: any) => ({ ...p, email: e.target.value }))}
                          disabled={!editingProfile}
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editableProfile.phone}
                          onChange={(e) => setEditableProfile((p: any) => ({ ...p, phone: e.target.value }))}
                          disabled={!editingProfile}
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editableProfile.location}
                          onChange={(e) => setEditableProfile((p: any) => ({ ...p, location: e.target.value }))}
                          disabled={!editingProfile}
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Car className="w-5 h-5" />
                      <span>Vehicle Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Make</Label>
                        <Input
                          value={editableProfile.vehicleDetails?.make}
                          disabled={!editingProfile}
                          onChange={(e) =>
                            setEditableProfile((p: any) => ({
                              ...p,
                              vehicleDetails: { ...p.vehicleDetails, make: e.target.value },
                            }))
                          }
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input
                          value={editableProfile.vehicleDetails?.model}
                          disabled={!editingProfile}
                          onChange={(e) =>
                            setEditableProfile((p: any) => ({
                              ...p,
                              vehicleDetails: { ...p.vehicleDetails, model: e.target.value },
                            }))
                          }
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          type="number"
                          value={editableProfile.vehicleDetails?.year ?? ""}
                          disabled={!editingProfile}
                          onChange={(e) =>
                            setEditableProfile((p: any) => ({
                              ...p,
                              vehicleDetails: {
                                ...p.vehicleDetails,
                                year: e.target.value ? Number(e.target.value) : undefined,
                              },
                            }))
                          }
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Connector</Label>
                        <Select
                          value={editableProfile.vehicleDetails?.primaryConnector}
                          onValueChange={(value) =>
                            setEditableProfile((p: any) => ({
                              ...p,
                              vehicleDetails: { ...p.vehicleDetails, primaryConnector: value },
                            }))
                          }
                          disabled={!editingProfile}
                        >
                          <SelectTrigger className={!editingProfile ? "bg-gray-50" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONNECTORS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Charging Speed (kW)</Label>
                        <Input
                          type="number"
                          value={editableProfile.vehicleDetails?.maxChargingSpeed ?? ""}
                          disabled={!editingProfile}
                          onChange={(e) =>
                            setEditableProfile((p: any) => ({
                              ...p,
                              vehicleDetails: {
                                ...p.vehicleDetails,
                                maxChargingSpeed: e.target.value ? Number(e.target.value) : undefined,
                              },
                            }))
                          }
                          className={!editingProfile ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Adapters</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {CONNECTORS.filter((c) => c !== editableProfile.vehicleDetails.primaryConnector).map((c) => {
                          const active = editableProfile.vehicleDetails.adapters.includes(c)
                          return (
                            <Button
                              key={c}
                              type="button"
                              disabled={!editingProfile}
                              variant={active ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                editingProfile &&
                                setEditableProfile((p: any) => ({
                                  ...p,
                                  vehicleDetails: {
                                    ...p.vehicleDetails,
                                    adapters: active
                                      ? p.vehicleDetails.adapters.filter((a: string) => a !== c)
                                      : [...p.vehicleDetails.adapters, c],
                                  },
                                }))
                              }
                            >
                              {c}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Changes */}
                {editingProfile && (
                  <div className="flex justify-end gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Upload Photo
                    </Button>
                    <Button
                      onClick={handleProfileSave}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
            {activeView === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Charging Complete</div>
                        <div className="text-sm text-gray-600">Get notified when your charging session is complete</div>
                      </div>
                      <Switch
                        checked={settings.notifications.chargingComplete}
                        onCheckedChange={(checked) => handleSettingsChange("notifications", "chargingComplete", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Reservation Reminders</div>
                        <div className="text-sm text-gray-600">Reminders about upcoming reservations</div>
                      </div>
                      <Switch
                        checked={settings.notifications.reservationReminders}
                        onCheckedChange={(checked) =>
                          handleSettingsChange("notifications", "reservationReminders", checked)
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Promotions & Offers</div>
                        <div className="text-sm text-gray-600">Special deals and promotional offers</div>
                      </div>
                      <Switch
                        checked={settings.notifications.promotions}
                        onCheckedChange={(checked) => handleSettingsChange("notifications", "promotions", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Privacy & Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Share Location</div>
                        <div className="text-sm text-gray-600">Allow location sharing for better recommendations</div>
                      </div>
                      <Switch
                        checked={settings.privacy.shareLocation}
                        onCheckedChange={(checked) => handleSettingsChange("privacy", "shareLocation", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Share Charging Data</div>
                        <div className="text-sm text-gray-600">Help improve our service with anonymous usage data</div>
                      </div>
                      <Switch
                        checked={settings.privacy.shareChargingData}
                        onCheckedChange={(checked) => handleSettingsChange("privacy", "shareChargingData", checked)}
                      />
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full bg-transparent">
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select
                          value={settings.preferences.language}
                          onValueChange={(v) => handleSettingsChange("preferences", "language", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={settings.preferences.currency}
                          onValueChange={(v) => handleSettingsChange("preferences", "currency", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TND">TND (Tunisian Dinar)</SelectItem>
                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                            <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select
                          value={settings.preferences.theme}
                          onValueChange={(v) => handleSettingsChange("preferences", "theme", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <div className="font-medium">Auto Reserve</div>
                          <div className="text-xs text-gray-500">
                            Automatically reserve a charger when you arrive
                          </div>
                        </div>
                        <Switch
                          checked={settings.preferences.autoReserve}
                          onCheckedChange={(checked) =>
                            handleSettingsChange("preferences", "autoReserve", checked)
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                  >
                    {savingSettings ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </motion.div>
            )}
            {activeView === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-800">Charging History</h3>
                </div>
                {history.length === 0 ? (
                  <Card className="bg-gray-50">
                    <CardContent className="p-8 text-center">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No charging history yet</p>
                      <p className="text-sm text-gray-500 mt-2">Your charging sessions will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {history.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">{session.stationId}</div>
                              <div className="text-sm text-gray-600">{session.expiresAt}</div>
                            </div>
                            <Badge variant="secondary">{session.paymentMethod}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {activeView === "favorites" && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-800">Favorite Stations</h3>
                </div>
                {favorites.length === 0 ? (
                  <Card className="bg-gray-50">
                    <CardContent className="p-8 text-center">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No favorite stations yet</p>
                      <p className="text-sm text-gray-500 mt-2">Tap the heart icon on stations to save them here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-gray-600">
                    {favorites.map((stationId) => (
                      <div key={stationId} className="py-1">
                        {stationId}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {activeView === "support" && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-800">Report an Issue</h3>
                </div>
                <Card>
                  <CardContent className="p-4">
                    <form onSubmit={handleReclamationSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="station-select">Station</Label>
                        <Select
                          value={reclamationForm.stationId}
                          onValueChange={(value) => setReclamationForm({ ...reclamationForm, stationId: value })}
                        >
                          <SelectTrigger id="station-select">
                            <SelectValue placeholder="Select a station to report" />
                          </SelectTrigger>
                          <SelectContent>
                            {history.map((session) => (
                              <SelectItem key={session.id} value={session.stationId}>
                                {session.stationId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="issue-title">Title</Label>
                          <Input
                            id="issue-title"
                            value={reclamationForm.title}
                            onChange={(e) => setReclamationForm({ ...reclamationForm, title: e.target.value })}
                            placeholder="e.g., Charger not working"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="issue-category">Category</Label>
                          <Select
                            value={reclamationForm.category}
                            onValueChange={(value) => setReclamationForm({ ...reclamationForm, category: value })}
                          >
                            <SelectTrigger id="issue-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Incorrect Station Info">Incorrect Info</SelectItem>
                              <SelectItem value="Broken Charger">Broken Charger</SelectItem>
                              <SelectItem value="Billing Issue">Billing Issue</SelectItem>
                              <SelectItem value="General Feedback">General Feedback</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="issue-description">Describe the issue</Label>
                        <textarea
                          id="issue-description"
                          value={reclamationForm.description}
                          onChange={(e) => setReclamationForm({ ...reclamationForm, description: e.target.value })}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                          rows={4}
                          placeholder="Please provide details about the issue..."
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Submit Report
                      </Button>
                    </form>

                    {reclamations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-gray-700">Submitted Issues</h4>
                        {reclamations.map((rec, idx) => (
                          <div key={idx} className="text-sm text-gray-600 border-b py-1">
                            {rec.description} <span className="text-xs text-gray-400">({rec.status})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )
}
