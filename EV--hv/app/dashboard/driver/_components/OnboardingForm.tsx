"use client"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Car,
  AlertTriangle,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CONNECTOR_TYPES, ConnectorType } from "@/app/shared/connectors"
import type { CarOwner } from "../types"

type Props = {
  initialData?: CarOwner
  onComplete: (data: CarOwner) => void
}

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
}

const vehicleTypes = [
  { id: "sedan", name: "Sedan", icon: "🚗", popular: true },
  { id: "suv", name: "SUV", icon: "🚙", popular: true },
  { id: "hatchback", name: "Hatchback", icon: "🚗", popular: false },
  { id: "truck", name: "Truck", icon: "🛻", popular: false },
  { id: "van", name: "Van", icon: "🚐", popular: false },
]

const connectorTypes = [
  { id: "CCS", name: "CCS Combo", description: "Most common in Europe/US", icon: "⚡", popular: true },
  { id: "CHAdeMO", name: "CHAdeMO", description: "Common in Asian vehicles", icon: "🔌", popular: true },
  { id: "Type2", name: "Type 2", description: "AC charging standard", icon: "🔋", popular: true },
  { id: "Tesla", name: "Tesla Supercharger", description: "Tesla vehicles", icon: "⚡", popular: true },
  { id: "Type1", name: "Type 1 (J1772)", description: "Older US standard", icon: "🔌", popular: false },
]

const popularBrands = [
  "Tesla",
  "BMW",
  "Mercedes",
  "Audi",
  "Volkswagen",
  "Nissan",
  "Hyundai",
  "Kia",
  "Ford",
  "Chevrolet",
]

function normalize(raw: any): CarOwner | null {
  if (!raw) return null
  const u = raw.user || raw
  const id = u.id || u._id
  return {
    id,
    fullName: u.fullName || "",
    email: u.email || "",
    vehicleDetails: u.vehicleDetails || u.vehicle || {
      make: "",
      model: "",
      year: u.vehicleDetails?.year,
      primaryConnector: "",
      maxChargingSpeed: u.vehicleDetails?.maxChargingSpeed,
      adapters: u.vehicleDetails?.adapters || [],
    },
    preferences: u.preferences || { preferredNetworks: [], requiredAmenities: [] },
  }
}

export default function OnboardingForm({ initialData, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    vehicleDetails: {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "veh_" + Math.random().toString(36).slice(2,10),
      make: "",
      model: "",
      year: "",
      batteryCapacityKWh: "",
      primaryConnector: "CCS" as ConnectorType,
      adapters: [] as ConnectorType[],
    },
    preferences: {
      preferredNetworks: initialData?.preferences?.preferredNetworks || [],
      requiredAmenities: initialData?.preferences?.requiredAmenities || [],
    },
  })
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // If initialData changes after mount (unlikely) sync it.
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        fullName: initialData.fullName || prev.fullName,
        email: initialData.email || prev.email,
        vehicleDetails: {
          ...prev.vehicleDetails,
          ...initialData.vehicleDetails,
          adapters: initialData.vehicleDetails?.adapters || [],
        },
        preferences: {
          preferredNetworks: initialData.preferences?.preferredNetworks || [],
          requiredAmenities: initialData.preferences?.requiredAmenities || [],
        },
      }))
    }
  }, [initialData])

  const steps = [
    { title: "Personal Info", icon: User, description: "Confirm your details" },
    { title: "Vehicle Details", icon: Car, description: "Your electric vehicle" },
    { title: "Preferences", icon: Settings, description: "Customize your experience" },
    { title: "Complete", icon: Sparkles, description: "You're all set!" },
  ]

  const validateField = (name: string, value: any) => {
    const errors: Record<string, string> = {}
    switch (name) {
      case "fullName":
        if (!value || value.length < 2) errors.fullName = "Name must be at least 2 characters"
        break
      case "email":
        if (!value || !/\S+@\S+\.\S+/.test(value)) errors.email = "Please enter a valid email"
        break
      case "vehicleDetails.make":
        if (!value) errors["vehicleDetails.make"] = "Vehicle make is required"
        break
      case "vehicleDetails.model":
        if (!value) errors["vehicleDetails.model"] = "Vehicle model is required"
        break
      case "vehicleDetails.primaryConnector":
        if (!value) errors["vehicleDetails.primaryConnector"] = "Primary connector is required"
        break
    }
    setValidationErrors((prev) => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name.startsWith("vehicleDetails.")) {
      const field = name.split(".")[1]
      setForm((prev) => ({
        ...prev,
        vehicleDetails: {
          ...prev.vehicleDetails,
            [field]:
              field === "year" || field === "maxChargingSpeed"
                ? value
                  ? Number(value)
                  : undefined
                : value,
        },
      }))
    } else if (name.startsWith("preferences.")) {
      const key = name.split(".")[1]
      setForm((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: value.split(",").map((v) => v.trim()).filter(Boolean),
        },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    validateField(name, value)
    setError(null)
  }

  const handleConnectorSelect = (connectorId: string) => {
    setForm((prev) => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, primaryConnector: connectorId },
    }))
    validateField("vehicleDetails.primaryConnector", connectorId)
  }

  const handleBrandSelect = (brand: string) => {
    setForm((prev) => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, make: brand },
    }))
    validateField("vehicleDetails.make", brand)
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return (
          form.fullName &&
          form.email &&
          !validationErrors.fullName &&
          !validationErrors.email
        )
      case 1:
        return (
          form.vehicleDetails.make &&
          form.vehicleDetails.model &&
          form.vehicleDetails.primaryConnector &&
          !validationErrors["vehicleDetails.make"] &&
            !validationErrors["vehicleDetails.model"] &&
            !validationErrors["vehicleDetails.primaryConnector"]
        )
      case 2:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canProceedToNext() && currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const userId =
        initialData?.id ||
        (typeof window !== "undefined" ? localStorage.getItem("driverUserId") : null)

      if (!userId) {
        setError("User ID not found. Please sign in again.")
        setIsLoading(false)
        return
      }

      // Build payload: (avoid sending email if backend disallows changing)
      const payload = {
        fullName: form.fullName,
        vehicleDetails: {
          ...form.vehicleDetails,
          year: form.vehicleDetails.year ? Number(form.vehicleDetails.year) : undefined,
          batteryCapacityKWh: form.vehicleDetails.batteryCapacityKWh
            ? Number(form.vehicleDetails.batteryCapacityKWh)
            : undefined,
        },
      }

      localStorage.setItem("driverVehicle", JSON.stringify(payload.vehicleDetails))
      await api.updateProfile(userId, payload)
      const normalized = normalize(res) || { id: userId, ...form }
      setCurrentStep(3)

      // Delay for small success animation then call onComplete
      setTimeout(() => onComplete(normalized), 1400)
    } catch (err) {
      console.error(err)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-lime-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lime-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {React.createElement(steps[currentStep].icon, { className: "w-10 h-10 text-white" })}
            </motion.div>
          </div>

          <div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent">
              {currentStep === 3 ? "Setup Complete!" : "Complete Your Profile"}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              {steps[currentStep].description}
            </CardDescription>
          </div>

            <div className="w-full max-w-md mx-auto space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>

          <div className="flex justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index <= currentStep ? "bg-emerald-500 text-white shadow-lg" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                </div>
                <span className={`text-xs font-medium ${index <= currentStep ? "text-emerald-600" : "text-gray-400"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className={`h-12 ${
                          validationErrors.fullName
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        }`}
                      />
                      {validationErrors.fullName && (
                        <p className="text-sm text-red-600">{validationErrors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className={`h-12 ${
                          validationErrors.email
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        }`}
                        disabled={!!initialData?.email} // lock email if already set
                      />
                      {validationErrors.email && (
                        <p className="text-sm text-red-600">{validationErrors.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Popular Brands</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {popularBrands.map((brand) => (
                        <Button
                          key={brand}
                          type="button"
                          variant={form.vehicleDetails.make === brand ? "default" : "outline"}
                          className={`h-12 ${
                            form.vehicleDetails.make === brand
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                              : "hover:border-emerald-300"
                          }`}
                          onClick={() => handleBrandSelect(brand)}
                        >
                          {brand}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Make *</Label>
                      <Input
                        name="vehicleDetails.make"
                        value={form.vehicleDetails.make}
                        onChange={handleChange}
                        placeholder="e.g., Tesla"
                        className={`h-12 ${
                          validationErrors["vehicleDetails.make"]
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors["vehicleDetails.make"] && (
                        <p className="text-sm text-red-600">
                          {validationErrors["vehicleDetails.make"]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Model *</Label>
                      <Input
                        name="vehicleDetails.model"
                        value={form.vehicleDetails.model}
                        onChange={handleChange}
                        placeholder="e.g., Model 3"
                        className={`h-12 ${
                          validationErrors["vehicleDetails.model"]
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-emerald-500"
                        }`}
                      />
                      {validationErrors["vehicleDetails.model"] && (
                        <p className="text-sm text-red-600">
                          {validationErrors["vehicleDetails.model"]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        name="vehicleDetails.year"
                        type="number"
                        value={form.vehicleDetails.year}
                        onChange={handleChange}
                        placeholder="2023"
                        className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Primary Connector *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {connectorTypes.map((c) => (
                        <Card
                          key={c.id}
                          className={`cursor-pointer transition-all ${
                            form.vehicleDetails.primaryConnector === c.id
                              ? "ring-2 ring-emerald-500 bg-emerald-50"
                              : "hover:border-emerald-300"
                          }`}
                          onClick={() => handleConnectorSelect(c.id)}
                        >
                          <CardContent className="p-4 flex items-center space-x-3">
                            <div className="text-2xl">{c.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{c.name}</h4>
                                {c.popular && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{c.description}</p>
                            </div>
                            {form.vehicleDetails.primaryConnector === c.id && (
                              <Check className="w-5 h-5 text-emerald-500" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {validationErrors["vehicleDetails.primaryConnector"] && (
                      <p className="text-sm text-red-600">
                        {validationErrors["vehicleDetails.primaryConnector"]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Max Charging Speed (kW)</Label>
                    <Input
                      name="vehicleDetails.maxChargingSpeed"
                      type="number"
                      value={form.vehicleDetails.maxChargingSpeed}
                      onChange={handleChange}
                      placeholder="150"
                      className="h-12 border-gray-200 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-600">Additional Adapters</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CONNECTOR_TYPES
                        .filter(c => c !== form.vehicleDetails.primaryConnector)
                        .map(c => {
                          const active = form.vehicleDetails.adapters.includes(c)
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => {
                                const next = active
                                  ? form.vehicleDetails.adapters.filter(a => a !== c)
                                  : [...form.vehicleDetails.adapters, c]
                                setForm(prev => ({ ...prev, vehicleDetails: { ...prev.vehicleDetails, adapters: next } }))
                              }}
                              className={`px-3 py-1 text-xs rounded-full border transition
                                ${active
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"}`}
                            >
                              {c}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Preferred Networks</Label>
                      <Input
                        name="preferences.preferredNetworks"
                        placeholder="e.g., Tesla, ChargePoint"
                        value={form.preferences?.preferredNetworks?.join(", ") || ""}
                        onChange={handleChange}
                        className="h-12 border-gray-200 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Required Amenities</Label>
                      <Input
                        name="preferences.requiredAmenities"
                        placeholder="e.g., WiFi, Restrooms"
                        value={form.preferences?.requiredAmenities?.join(", ") || ""}
                        onChange={handleChange}
                        className="h-12 border-gray-200 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Vehicle & Connectors */}
                  <div className="space-y-4 border rounded-lg p-4">
                    <h3 className="font-semibold text-sm text-gray-700">Vehicle & Charging</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                      <input
                        className="input"
                        placeholder="Make"
                        value={form.vehicleDetails.make}
                        onChange={e => setForm(prev => ({ ...prev, vehicleDetails: { ...prev.vehicleDetails, make: e.target.value } }))}
                      />
                      <input
                        className="input"
                        placeholder="Model"
                        value={form.vehicleDetails.model}
                        onChange={e => setForm(prev => ({ ...prev, vehicleDetails: { ...prev.vehicleDetails, model: e.target.value } }))}
                      />
                      <input
                        type="number"
                        className="input"
                        placeholder="Year"
                        value={form.vehicleDetails.year}
                        onChange={e => setForm(prev => ({ ...prev, vehicleDetails: { ...prev.vehicleDetails, year: e.target.value ? +e.target.value : undefined } }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600">Primary Connector</label>
                      <select
                        className="mt-1 input"
                        value={form.vehicleDetails.primaryConnector}
                        onChange={e =>
                          setForm(prev => ({
                            ...prev,
                            vehicleDetails: {
                              ...prev.vehicleDetails,
                              primaryConnector: e.target.value as ConnectorType,
                              // remove from adapters if it was selected there
                              adapters: (prev.vehicleDetails.adapters || []).filter(a => a !== e.target.value),
                            },
                          }))
                        }
                      >
                        {CONNECTOR_TYPES.map(ct => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600">Adapters Owned</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {CONNECTOR_TYPES.filter(c => c !== form.vehicleDetails.primaryConnector).map(c => {
                          const active = form.vehicleDetails.adapters.includes(c)
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => {
                                const next = active
                                  ? form.vehicleDetails.adapters.filter(a => a !== c)
                                  : [...form.vehicleDetails.adapters, c]
                                setForm(prev => ({ ...prev, vehicleDetails: { ...prev.vehicleDetails, adapters: next } }))
                              }}
                              className={`px-3 py-1 text-xs rounded-full border transition
                                ${active
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"}`}
                            >
                              {c}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Setup Complete!
                    </h3>
                    <p className="text-gray-600">
                      Welcome! We are getting your charging experience ready.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </motion.div>
          )}

          {currentStep < 3 && (
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || isLoading}
                className="flex items-center space-x-2 bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {currentStep === 2 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !canProceedToNext()}
                  className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold px-8 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNext() || isLoading}
                  className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold px-8 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return "veh_" + Math.random().toString(36).slice(2, 10)
}