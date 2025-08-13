"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X, Upload, MapPin, Clock, Zap, DollarSign, Camera } from "lucide-react"
import type { Connector, OperatingHours, Pricing } from "../types"

interface AddStationModalProps {
  onStationAdded: () => void
}

export function AddStationModal({ onStationAdded }: AddStationModalProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          coordinates: [
            Number(formData.coordinates.longitude),
            Number(formData.coordinates.latitude),
          ],
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
          chargerLevel: c.level,
          powerKW: c.powerKw,
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
      id: `connector-${Date.now()}`,
      type: "Type 2",
      level: "Level 2",
      powerKw: 22,
      status: "available",
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
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Station Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Downtown Charging Hub"
                />
              </div>
              <div>
                <Label htmlFor="network">Network Name</Label>
                <Input
                  id="network"
                  value={formData.networkName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, networkName: e.target.value }))}
                  placeholder="ChargePoint, EVgo, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="street">Street Address</Label>
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
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
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
                />
              </div>
              <div>
                <Label htmlFor="state">State/Region</Label>
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
                />
              </div>
              <div>
                <Label htmlFor="zip">Zip Code</Label>
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
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude</Label>
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
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
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
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Operating Hours</h3>
            </div>

            <div className="space-y-3">
              {days.map((day) => (
                <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="w-20 capitalize font-medium">{day}</div>
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
                      />
                      <span className="text-sm">24/7</span>
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
                            className="w-24"
                          />
                          <span>to</span>
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
                            className="w-24"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Connectors</h3>
              </div>
              <Button onClick={addConnector} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Connector
              </Button>
            </div>

            <div className="space-y-3">
              {formData.connectors.map((connector, index) => (
                <Card key={connector.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Connector {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConnector(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={connector.type}
                          onValueChange={(value) => {
                            const updatedConnectors = [...formData.connectors]
                            updatedConnectors[index].type = value as any
                            setFormData((prev) => ({ ...prev, connectors: updatedConnectors }))
                          }}
                        >
                          <SelectTrigger>
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

                      <div>
                        <Label>Level</Label>
                        <Select
                          value={connector.level}
                          onValueChange={(value) => {
                            const updatedConnectors = [...formData.connectors]
                            updatedConnectors[index].level = value as any
                            setFormData((prev) => ({ ...prev, connectors: updatedConnectors }))
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Level 1">Level 1</SelectItem>
                            <SelectItem value="Level 2">Level 2</SelectItem>
                            <SelectItem value="DC Fast">DC Fast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Power (kW)</Label>
                        <Input
                          type="number"
                          value={connector.powerKw}
                          onChange={(e) => {
                            const updatedConnectors = [...formData.connectors]
                            updatedConnectors[index].powerKw = Number.parseInt(e.target.value) || 0
                            setFormData((prev) => ({ ...prev, connectors: updatedConnectors }))
                          }}
                          placeholder="22"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Pricing Configuration</h3>
            </div>

            <div>
              <Label>Pricing Model</Label>
              <Select
                value={formData.pricing.model}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricing: { ...prev.pricing, model: value as any },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_kwh">Per kWh</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="hybrid">Hybrid (kWh + Hour)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(formData.pricing.model === "per_kwh" || formData.pricing.model === "hybrid") && (
                <div>
                  <Label>Price per kWh ($)</Label>
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
                  />
                </div>
              )}

              {(formData.pricing.model === "per_hour" || formData.pricing.model === "hybrid") && (
                <div>
                  <Label>Price per Hour ($)</Label>
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
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Session Fee ($)</Label>
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
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.pricing.hasPeakHours}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    pricing: { ...prev.pricing, hasPeakHours: checked },
                  }))
                }
              />
              <Label>Peak Hour Pricing</Label>
            </div>

            {formData.pricing.hasPeakHours && (
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Peak Start Time</Label>
                  <Input
                    type="time"
                    value={formData.pricing.peakStartTime || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, peakStartTime: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Peak End Time</Label>
                  <Input
                    type="time"
                    value={formData.pricing.peakEndTime || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pricing: { ...prev.pricing, peakEndTime: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Peak Surcharge ($)</Label>
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
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Pricing Notes</Label>
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
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Amenities & Photos</h3>
            </div>

            <div>
              <Label className="text-base font-medium">Available Amenities</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {availableAmenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.amenities.includes(amenity.id)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleAmenity(amenity.id)}
                  >
                    <span className="text-xl">{amenity.icon}</span>
                    <span className="font-medium">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Station Photos</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload photos of your charging station</p>
                <Button variant="outline" size="sm">
                  Choose Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB each</p>
              </div>
            </div>

            {formData.amenities.length > 0 && (
              <div>
                <Label className="text-base font-medium">Selected Amenities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.amenities.map((amenityId) => {
                    const amenity = availableAmenities.find((a) => a.id === amenityId)
                    return amenity ? (
                      <Badge key={amenityId} variant="secondary" className="flex items-center space-x-1">
                        <span>{amenity.icon}</span>
                        <span>{amenity.name}</span>
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Station
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Charging Station</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? "bg-green-600 text-white"
                    : step < currentStep
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {step}
              </div>
            ))}
          </div>

          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
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
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating Station..." : "Create Station"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
