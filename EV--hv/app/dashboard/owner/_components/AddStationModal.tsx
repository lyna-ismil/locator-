"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X, Upload, MapPin, Clock, Zap, DollarSign, Camera, CheckCircle } from "lucide-react"
import type { Connector } from "../types"

type OperatingHours = {
  [day: string]: {
    isOpen: boolean
    is24Hours?: boolean
    openTime?: string
    closeTime?: string
  }
}

type Pricing = {
  model: "per_kwh" | "per_hour" | "hybrid"
  perKwh?: number
  perHour?: number
  sessionFee?: number
  hasPeakHours?: boolean
  peakStartTime?: string
  peakEndTime?: string
  peakSurcharge?: number
  notes?: string
}

interface AddStationModalProps {
  onStationAdded: () => void
  open?: boolean
  setOpen?: (open: boolean) => void
  startStep?: number
}

export function AddStationModal({
  onStationAdded,
  open: controlledOpen,
  setOpen: setControlledOpen,
  startStep = 1,
}: AddStationModalProps) {
  const [open, setOpen] = useState(controlledOpen ?? false)
  const [currentStep, setCurrentStep] = useState(startStep)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync controlled open/step
  useEffect(() => {
    if (typeof controlledOpen === "boolean") setOpen(controlledOpen)
  }, [controlledOpen])
  useEffect(() => {
    setCurrentStep(startStep)
  }, [startStep, controlledOpen])

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    networkName: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    operatingHours: {} as OperatingHours,
    connectors: [] as Connector[],
    pricing: {
      model: "per_kwh",
      perKwh: 0,
      sessionFee: 0,
      hasPeakHours: false,
    } as Pricing,
    amenities: [] as string[],
    photos: [] as string[],
  })

  const availableAmenities = [
    { id: "wifi", name: "Wi-Fi", icon: "📶" },
    { id: "restrooms", name: "Restrooms", icon: "🚻" },
    { id: "food", name: "Food", icon: "🍕" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "parking", name: "Free Parking", icon: "🅿️" },
    { id: "coffee", name: "Coffee Shop", icon: "☕" },
  ]

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Prepare data to match your backend Station model
      const payload = {
        stationName: formData.name,
        network: formData.networkName,
        location: {
          type: "Point",
          coordinates: [Number(formData.coordinates.longitude), Number(formData.coordinates.latitude)],
        },
        address: {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: formData.address.zipCode,
        },
        operatingHours: "24/7", // Or map your formData.operatingHours as needed
        connectors: formData.connectors.map((c) => ({
          type: c.type,
          chargerLevel: c.chargerLevel, // Use chargerLevel only, since 'level' does not exist
          powerKW: c.powerKW,
        })),
        pricing: {
          perHour: formData.pricing.perHour || 0,
          perkWh: formData.pricing.perKwh || 0,
          sessionFee: formData.pricing.sessionFee || 0,
          notes: formData.pricing.notes || "",
        },
        amenities: {
          wifi: formData.amenities.includes("wifi"),
          restrooms: formData.amenities.includes("restrooms"),
          food: formData.amenities.includes("food"),
          shopping: formData.amenities.includes("shopping"),
        },
        // Add other fields as needed
      }

      // Send POST request to backend
      const response = await fetch("http://localhost:5000/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to add station.")
      }

      onStationAdded()
      setOpen(false)
      setCurrentStep(1)
      // Reset form
      setFormData({
        name: "",
        networkName: "",
        address: { street: "", city: "", state: "", zipCode: "" },
        coordinates: { latitude: 0, longitude: 0 },
        operatingHours: {},
        connectors: [],
        pricing: { model: "per_kwh", perKwh: 0, sessionFee: 0, hasPeakHours: false },
        amenities: [],
        photos: [],
      })
    } catch (error) {
      console.error("Failed to add station:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addConnector = () => {
    const newConnector: Connector = {
      _id: `connector-${Date.now()}`,
      type: "Type 2",
      chargerLevel: "Level 2",
      powerKW: 22,
      status: "Available",
    }
    setFormData((prev) => ({
      ...prev,
      connectors: [...prev.connectors, newConnector],
    }))
  }

  const removeConnector = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      connectors: prev.connectors.filter((_, i) => i !== index),
    }))
  }

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId],
    }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-600">Enter your station's basic details and location</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Station Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Downtown Charging Hub"
                  className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="network" className="text-sm font-medium text-gray-700">
                  Network Name
                </Label>
                <Input
                  id="network"
                  value={formData.networkName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, networkName: e.target.value }))}
                  placeholder="ChargePoint, EVgo, etc."
                  className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

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
                placeholder="123 Main Street"
                className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                  placeholder="Tunis"
                  className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                  placeholder="Tunis"
                  className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
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
                  placeholder="1000"
                  className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Precise Location Coordinates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat" className="text-sm font-medium text-gray-600">
                    Latitude
                  </Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.coordinates.latitude}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        coordinates: { ...prev.coordinates, latitude: Number.parseFloat(e.target.value) || 0 },
                      }))
                    }
                    placeholder="36.8065"
                    className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng" className="text-sm font-medium text-gray-600">
                    Longitude
                  </Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.coordinates.longitude}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        coordinates: { ...prev.coordinates, longitude: Number.parseFloat(e.target.value) || 0 },
                      }))
                    }
                    placeholder="10.1815"
                    className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
                <p className="text-sm text-gray-600">Set your station's availability schedule</p>
              </div>
            </div>

            <div className="space-y-3">
              {days.map((day) => (
                <Card key={day} className="border-gray-200 hover:border-gray-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-24 capitalize font-medium text-gray-700">{day}</div>
                      <Switch
                        checked={formData.operatingHours[day]?.isOpen || false}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              [day]: {
                                isOpen: checked,
                                is24Hours: false,
                                openTime: "09:00",
                                closeTime: "18:00",
                              },
                            },
                          }))
                        }}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                      {formData.operatingHours[day]?.isOpen && (
                        <>
                          <Switch
                            checked={formData.operatingHours[day]?.is24Hours || false}
                            onCheckedChange={(checked) => {
                              setFormData((prev) => ({
                                ...prev,
                                operatingHours: {
                                  ...prev.operatingHours,
                                  [day]: {
                                    ...prev.operatingHours[day],
                                    is24Hours: checked,
                                  },
                                },
                              }))
                            }}
                            className="data-[state=checked]:bg-emerald-600"
                          />
                          <span className="text-sm font-medium text-gray-600">24/7</span>
                          {!formData.operatingHours[day]?.is24Hours && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={formData.operatingHours[day]?.openTime || "09:00"}
                                onChange={(e) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    operatingHours: {
                                      ...prev.operatingHours,
                                      [day]: {
                                        ...prev.operatingHours[day],
                                        openTime: e.target.value,
                                      },
                                    },
                                  }))
                                }}
                                className="w-28 h-9 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="text-gray-500 font-medium">to</span>
                              <Input
                                type="time"
                                value={formData.operatingHours[day]?.closeTime || "18:00"}
                                onChange={(e) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    operatingHours: {
                                      ...prev.operatingHours,
                                      [day]: {
                                        ...prev.operatingHours[day],
                                        closeTime: e.target.value,
                                      },
                                    },
                                  }))
                                }}
                                className="w-28 h-9 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Connectors</h3>
                  <p className="text-sm text-gray-600">Configure your charging connectors</p>
                </div>
              </div>
              <Button onClick={addConnector} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Connector
              </Button>
            </div>

            <div className="space-y-4">
              {formData.connectors.map((connector, index) => (
                <Card
                  key={connector._id}
                  className="border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-emerald-600">{index + 1}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900">Connector {index + 1}</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConnector(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Type</Label>
                        <Select
                          value={connector.type}
                          onValueChange={(value) => {
                            const updatedConnectors = [...formData.connectors]
                            updatedConnectors[index].type = value as any
                            setFormData((prev) => ({ ...prev, connectors: updatedConnectors }))
                          }}
                        >
                          <SelectTrigger className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Type 1">Type 1</SelectItem>
                            <SelectItem value="Type 2">Type 2</SelectItem>
                            <SelectItem value="CCS">CCS</SelectItem>
                            <SelectItem value="CHAdeMO">CHAdeMO</SelectItem>
                            <SelectItem value="Tesla">Tesla</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Level</Label>
                        <Select
                          value={connector.chargerLevel}
                          onValueChange={(value) => {
                            const updatedConnectors = [...formData.connectors]
                            updatedConnectors[index].chargerLevel = value as any
                            setFormData((prev) => ({ ...prev, connectors: updatedConnectors }))
                          }}
                        >
                          <SelectTrigger className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Level 1">Level 1</SelectItem>
                            <SelectItem value="Level 2">Level 2</SelectItem>
                            <SelectItem value="DC Fast">DC Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Power (kW)</Label>
                        <Input
                          type="number"
                          value={connector.powerKW}
                          onChange={(e) => {
                            const updatedConnectors = [...formData.connectors]
                            updatedConnectors[index].powerKW = Number.parseInt(e.target.value) || 0
                            setFormData((prev) => ({ ...prev, connectors: updatedConnectors }))
                          }}
                          placeholder="22"
                          className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.connectors.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No connectors added yet</p>
                  <p className="text-sm text-gray-500 mt-1">Click "Add Connector" to get started</p>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pricing Configuration</h3>
                <p className="text-sm text-gray-600">Set your charging rates and fees</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Pricing Model</Label>
                <Select
                  value={formData.pricing.model}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, model: value as any },
                    }))
                  }
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_kwh">Per kWh</SelectItem>
                    <SelectItem value="per_hour">Per Hour</SelectItem>
                    <SelectItem value="hybrid">Hybrid (kWh + Hour)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {(formData.pricing.model === "per_kwh" || formData.pricing.model === "hybrid") && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Price per kWh ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.pricing.perKwh || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricing: { ...prev.pricing, perKwh: Number.parseFloat(e.target.value) || 0 },
                        }))
                      }
                      placeholder="0.25"
                      className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {(formData.pricing.model === "per_hour" || formData.pricing.model === "hybrid") && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Price per Hour ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.pricing.perHour || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricing: { ...prev.pricing, perHour: Number.parseFloat(e.target.value) || 0 },
                        }))
                      }
                      placeholder="2.00"
                      className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Session Fee ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.pricing.sessionFee || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, sessionFee: Number.parseFloat(e.target.value) || 0 },
                    }))
                  }
                  placeholder="1.00"
                  className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Switch
                  checked={formData.pricing.hasPeakHours}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, hasPeakHours: checked },
                    }))
                  }
                  className="data-[state=checked]:bg-emerald-600"
                />
                <div>
                  <Label className="text-sm font-medium text-gray-700">Peak Hour Pricing</Label>
                  <p className="text-xs text-gray-500">Add surcharge during peak hours</p>
                </div>
              </div>

              {formData.pricing.hasPeakHours && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="p-6">
                    <h4 className="font-medium text-emerald-900 mb-4">Peak Hour Configuration</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Peak Start Time</Label>
                        <Input
                          type="time"
                          value={formData.pricing.peakStartTime || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pricing: { ...prev.pricing, peakStartTime: e.target.value },
                            }))
                          }
                          className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Peak End Time</Label>
                        <Input
                          type="time"
                          value={formData.pricing.peakEndTime || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pricing: { ...prev.pricing, peakEndTime: e.target.value },
                            }))
                          }
                          className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Peak Surcharge ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.pricing.peakSurcharge || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pricing: { ...prev.pricing, peakSurcharge: Number.parseFloat(e.target.value) || 0 },
                            }))
                          }
                          placeholder="0.10"
                          className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Pricing Notes</Label>
                <Textarea
                  value={formData.pricing.notes || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, notes: e.target.value },
                    }))
                  }
                  placeholder="Additional pricing information..."
                  rows={3}
                  className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Camera className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Amenities & Photos</h3>
                <p className="text-sm text-gray-600">Add amenities and upload station photos</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold text-gray-900 mb-4 block">Available Amenities</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableAmenities.map((amenity) => (
                    <Card
                      key={amenity.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        formData.amenities.includes(amenity.id)
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleAmenity(amenity.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{amenity.icon}</span>
                          <span className="font-medium text-gray-900">{amenity.name}</span>
                          {formData.amenities.includes(amenity.id) && (
                            <CheckCircle className="h-5 w-5 text-emerald-600 ml-auto" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold text-gray-900 mb-4 block">Station Photos</Label>
                <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                  <CardContent className="p-8 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Upload photos of your charging station</h4>
                    <p className="text-sm text-gray-600 mb-4">Help customers identify your location</p>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-gray-300 hover:border-gray-400 bg-transparent"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                    <p className="text-xs text-gray-500 mt-3">PNG, JPG up to 10MB each</p>
                  </CardContent>
                </Card>
              </div>

              {formData.amenities.length > 0 && (
                <div>
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">Selected Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenityId) => {
                      const amenity = availableAmenities.find((a) => a.id === amenityId)
                      return amenity ? (
                        <Badge
                          key={amenityId}
                          variant="secondary"
                          className="flex items-center space-x-2 px-3 py-1 bg-emerald-100 text-emerald-800 border-emerald-200"
                        >
                          <span>{amenity.icon}</span>
                          <span>{amenity.name}</span>
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setControlledOpen ?? setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-900">Add New Charging Station</DialogTitle>
          <p className="text-gray-600 mt-1">Create a comprehensive profile for your charging station</p>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="flex items-center justify-between px-4">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                    step === currentStep
                      ? "bg-emerald-600 text-white shadow-lg scale-110"
                      : step < currentStep
                        ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-600"
                        : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                {index < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-all duration-200 ${
                      step < currentStep ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="px-6">{renderStep()}</div>

          <div className="flex justify-between pt-6 px-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 border-gray-300 hover:border-gray-400"
            >
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.address.street)) ||
                  (currentStep === 3 && formData.connectors.length === 0)
                }
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isSubmitting ? "Creating Station..." : "Create Station"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
