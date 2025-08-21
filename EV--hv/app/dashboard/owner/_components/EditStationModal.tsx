"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Network,
  Camera,
  Mail,
  Clock,
  MapPin,
  DollarSign,
  Wifi,
  Car,
  Plus,
  Trash2,
  Edit3,
  BadgeCheck,
  Utensils,
  ShoppingBag,
  ParkingSquare,
  Coffee,
} from "lucide-react"
import type { Station } from "../types"
import { CONNECTOR_TYPES, CONNECTOR_STATUSES } from "@/app/shared/connectors"

interface EditStationModalProps {
  station: Station
  onClose: () => void
  onStationUpdated: () => void
}

export function EditStationModal({ station, onClose, onStationUpdated }: EditStationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    stationName: station.stationName || "",
    network: station.network || "",
    photoUrl: station.photoUrl || "",
    email: station.email || "",
    address: {
      street: station.address?.street || "",
      city: station.address?.city || "",
      state: station.address?.state || "",
      zipCode: station.address?.zipCode || "",
    },
    operatingHours: station.operatingHours || "",
    location: {
      coordinates: station.location?.coordinates || [0, 0],
    },
    pricing: {
      perHour: station.pricing?.perHour ?? "",
      perkWh: station.pricing?.perkWh ?? "",
      sessionFee: station.pricing?.sessionFee ?? "",
      notes: station.pricing?.notes ?? "",
    },
    amenities: {
      wifi: station.amenities?.wifi ?? false,
      restrooms: station.amenities?.restrooms ?? false,
      food: station.amenities?.food ?? false,
      shopping: station.amenities?.shopping ?? false,
      parking: station.amenities?.parking ?? false,
      coffee: station.amenities?.coffee ?? false,
    },
    connectors: station.connectors || [],
  })

  const availableAmenities = [
    { id: "wifi", name: "Wi-Fi", icon: <Wifi className="h-5 w-5 text-emerald-600" /> },
    { id: "restrooms", name: "Restrooms", icon: <BadgeCheck className="h-5 w-5 text-emerald-600" /> },
    { id: "food", name: "Food", icon: <Utensils className="h-5 w-5 text-emerald-600" /> },
    { id: "shopping", name: "Shopping", icon: <ShoppingBag className="h-5 w-5 text-emerald-600" /> },
    { id: "parking", name: "Free Parking", icon: <ParkingSquare className="h-5 w-5 text-emerald-600" /> },
    { id: "coffee", name: "Coffee Shop", icon: <Coffee className="h-5 w-5 text-emerald-600" /> },
  ]

  const handleConnectorChange = (idx: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      connectors: prev.connectors.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }))
  }

  const handleAmenityChange = (field: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [field]: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        address: { ...formData.address },
        location: {
          type: "Point",
          coordinates: [Number(formData.location.coordinates[0]), Number(formData.location.coordinates[1])],
        },
        pricing: { ...formData.pricing },
        amenities: { ...formData.amenities },
        connectors: formData.connectors,
      }

      console.log("Update payload:", payload)

      const response = await fetch(`http://localhost:5000/stations/${station._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Backend error:", errorText)
        throw new Error("Failed to update station. " + errorText)
      }

      onStationUpdated()
    } catch (error) {
      console.error("Failed to update station:", error)
      // Optionally show error to user
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh] bg-gradient-to-br from-white via-emerald-50/30 to-lime-50/20">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Edit3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Edit Station</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Update information for {station.stationName}</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stationName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    Station Name
                  </Label>
                  <Input
                    id="stationName"
                    value={formData.stationName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stationName: e.target.value }))}
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Network className="h-4 w-4 text-emerald-600" />
                    Network Name
                  </Label>
                  <Input
                    id="network"
                    value={formData.network}
                    onChange={(e) => setFormData((prev) => ({ ...prev, network: e.target.value }))}
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="photoUrl" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    Photo URL
                  </Label>
                  <Input
                    id="photoUrl"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, photoUrl: e.target.value }))}
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-600" />
                    Contact Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Clock className="h-5 w-5 text-emerald-600" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-lg border border-gray-200/50"
                  >
                    <div className="w-20 font-medium text-gray-700">{day}</div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!(formData.operatingHours?.[day]?.isClosed ?? true)}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              operatingHours: {
                                ...prev.operatingHours,
                                [day]: {
                                  ...prev.operatingHours?.[day],
                                  isClosed: !e.target.checked,
                                },
                              },
                            }))
                          }
                          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Open</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.operatingHours?.[day]?.is24Hours ?? false}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              operatingHours: {
                                ...prev.operatingHours,
                                [day]: {
                                  ...prev.operatingHours?.[day],
                                  is24Hours: e.target.checked,
                                },
                              },
                            }))
                          }
                          disabled={formData.operatingHours?.[day]?.isClosed ?? true}
                          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">24h</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="time"
                        value={formData.operatingHours?.[day]?.openTime || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              [day]: {
                                ...prev.operatingHours?.[day],
                                openTime: e.target.value,
                              },
                            },
                          }))
                        }
                        disabled={formData.operatingHours?.[day]?.isClosed ?? true || formData.operatingHours?.[day]?.is24Hours}
                        className="w-32 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="time"
                        value={formData.operatingHours?.[day]?.closeTime || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              [day]: {
                                ...prev.operatingHours?.[day],
                                closeTime: e.target.value,
                              },
                            },
                          }))
                        }
                        disabled={!formData.operatingHours?.[day]?.isOpen || formData.operatingHours?.[day]?.is24Hours}
                        className="w-32 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Location & Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                  Street Address
                </Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value },
                    }))
                  }
                  required
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value },
                      }))
                    }
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                    State/Region
                  </Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value },
                      }))
                    }
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm font-medium text-gray-700">
                    Zip Code
                  </Label>
                  <Input
                    id="zip"
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, zipCode: e.target.value },
                      }))
                    }
                    required
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">GPS Coordinates</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., 10.1815"
                      value={formData.location.coordinates[0]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            coordinates: [Number(e.target.value), prev.location.coordinates[1]],
                          },
                        }))
                      }
                      required
                      className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g., 36.8065"
                      value={formData.location.coordinates[1]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            coordinates: [prev.location.coordinates[0], Number(e.target.value)],
                          },
                        }))
                      }
                      required
                      className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Per Hour Rate</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.pricing.perHour}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricing: { ...prev.pricing, perHour: e.target.value },
                        }))
                      }
                      className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Per kWh Rate</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.pricing.perkWh}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricing: { ...prev.pricing, perkWh: e.target.value },
                        }))
                      }
                      className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Session Fee</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.pricing.sessionFee}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricing: { ...prev.pricing, sessionFee: e.target.value },
                        }))
                      }
                      className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Pricing Notes</Label>
                  <Input
                    type="text"
                    placeholder="Additional pricing information"
                    value={formData.pricing.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, notes: e.target.value },
                      }))
                    }
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Wifi className="h-5 w-5 text-emerald-600" />
                Available Amenities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableAmenities.map(a => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-200/50 cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities[a.id as keyof typeof formData.amenities]}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          amenities: {
                            ...prev.amenities,
                            [a.id]: e.target.checked,
                          },
                        }))
                      }
                      className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      {a.icon}
                      <span className="text-sm font-medium text-gray-700">{a.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/50 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Car className="h-5 w-5 text-emerald-600" />
                Charging Connectors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.connectors.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                  <Car className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No connectors added yet</p>
                </div>
              )}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Connectors</h4>
                {formData.connectors.map((c:any, i:number) => (
                  <div key={`${c._id || c.type}-${i}`} className="grid md:grid-cols-6 gap-2 items-center bg-gray-50 p-3 rounded">
                    <select
                      className="input"
                      value={c.type}
                      onChange={e =>
                        setFormData(p => {
                          const list = [...p.connectors]
                          list[i].type = e.target.value
                          return { ...p, connectors: list }
                        })
                      }
                    >
                      {CONNECTOR_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input
                      className="input md:col-span-2"
                      placeholder="Charger Level"
                      value={c.chargerLevel}
                      onChange={e =>
                        setFormData(p => {
                          const list = [...p.connectors]
                          list[i].chargerLevel = e.target.value
                          return { ...p, connectors: list }
                        })
                      }
                    />
                    <input
                      type="number"
                      className="input"
                      placeholder="kW"
                      min={1}
                      value={c.powerKW}
                      onChange={e =>
                        setFormData(p => {
                          const list = [...p.connectors]
                          list[i].powerKW = +e.target.value
                          return { ...p, connectors: list }
                        })
                      }
                    />
                    <select
                      className="input"
                      value={c.status}
                      onChange={e =>
                        setFormData(p => {
                          const list = [...p.connectors]
                          list[i].status = e.target.value
                          return { ...p, connectors: list }
                        })
                      }
                    >
                      {CONNECTOR_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button
                      type="button"
                      className="text-red-500 text-xs"
                      onClick={() =>
                        setFormData(p => ({ ...p, connectors: p.connectors.filter((_:any, idx:number) => idx !== i) }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs bg-emerald-600 text-white px-3 py-2 rounded"
                  onClick={() =>
                    setFormData(p => ({
                      ...p,
                      connectors: [
                        ...p.connectors,
                        { type: "CCS", chargerLevel: "AC Level 2", powerKW: 22, status: "Available" },
                      ],
                    }))
                  }
                >
                  + Add Connector
                </button>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? "Updating Station..." : "Update Station"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
