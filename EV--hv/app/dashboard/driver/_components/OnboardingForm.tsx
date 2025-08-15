"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Car,
  AlertTriangle,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { CarOwner } from "../types"

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

export default function OnboardingForm({ onComplete }: { onComplete: (data: CarOwner) => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<Omit<CarOwner, "id">>({
    fullName: "",
    email: "",
    password: "",
    vehicleDetails: {
      make: "",
      model: "",
      year: undefined,
      primaryConnector: "",
      maxChargingSpeed: undefined,
      adapters: [],
    },
    preferences: {
      preferredNetworks: [],
      requiredAmenities: [],
    },
  })
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const steps = [
    { title: "Personal Info", icon: User, description: "Tell us about yourself" },
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
      case "password":
        if (!value || value.length < 6) errors.password = "Password must be at least 6 characters"
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target

    if (name.startsWith("vehicleDetails.")) {
      const field = name.split(".")[1]
      setForm((prev) => ({
        ...prev,
        vehicleDetails: {
          ...prev.vehicleDetails,
          [field]: field === "year" || field === "maxChargingSpeed" ? (value ? Number(value) : undefined) : value,
        },
      }))
    } else if (name.startsWith("preferences.")) {
      setForm((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [name.split(".")[1]]: value.split(",").map((v) => v.trim()),
        },
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }

    // Real-time validation
    validateField(name, value)
    setError(null)
  }

  const handleConnectorSelect = (connectorId: string) => {
    setForm((prev) => ({
      ...prev,
      vehicleDetails: {
        ...prev.vehicleDetails,
        primaryConnector: connectorId,
      },
    }))
    validateField("vehicleDetails.primaryConnector", connectorId)
  }

  const handleBrandSelect = (brand: string) => {
    setForm((prev) => ({
      ...prev,
      vehicleDetails: {
        ...prev.vehicleDetails,
        make: brand,
      },
    }))
    validateField("vehicleDetails.make", brand)
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return (
          form.fullName &&
          form.email &&
          form.password &&
          !validationErrors.fullName &&
          !validationErrors.email &&
          !validationErrors.password
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
        return true // Preferences are optional
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canProceedToNext() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const carOwner: CarOwner = {
        id: Date.now().toString(),
        ...form,
      }
      const res = await api.signUp(carOwner)
      if (res.success) {
        setCurrentStep(3) // Success step
        setTimeout(() => onComplete(carOwner), 2000)
      } else {
        setError("Sign-up failed. Please try again.")
      }
    } catch (err) {
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
              {currentStep === 3 ? "Welcome Aboard!" : "Join ChargeConnect"}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">{steps[currentStep].description}</CardDescription>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto space-y-3">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index <= currentStep ? "bg-emerald-500 text-white shadow-lg" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
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
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={form.fullName}
                        onChange={handleChange}
                        className={`h-12 transition-all duration-200 ${
                          validationErrors.fullName
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        }`}
                      />
                      {validationErrors.fullName && <p className="text-sm text-red-600">{validationErrors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        className={`h-12 transition-all duration-200 ${
                          validationErrors.email
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        }`}
                      />
                      {validationErrors.email && <p className="text-sm text-red-600">{validationErrors.email}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        value={form.password}
                        onChange={handleChange}
                        className={`h-12 pr-12 transition-all duration-200 ${
                          validationErrors.password
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {validationErrors.password && <p className="text-sm text-red-600">{validationErrors.password}</p>}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  {/* Popular Brands */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Popular Brands</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {popularBrands.map((brand) => (
                        <Button
                          key={brand}
                          type="button"
                          variant={form.vehicleDetails.make === brand ? "default" : "outline"}
                          className={`h-12 transition-all duration-200 ${
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
                      <Label htmlFor="make" className="text-sm font-medium text-gray-700">
                        Make *
                      </Label>
                      <Input
                        id="make"
                        name="vehicleDetails.make"
                        placeholder="e.g., Tesla, BMW, Nissan"
                        value={form.vehicleDetails.make}
                        onChange={handleChange}
                        className={`h-12 transition-all duration-200 ${
                          validationErrors["vehicleDetails.make"]
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        }`}
                      />
                      {validationErrors["vehicleDetails.make"] && (
                        <p className="text-sm text-red-600">{validationErrors["vehicleDetails.make"]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-sm font-medium text-gray-700">
                        Model *
                      </Label>
                      <Input
                        id="model"
                        name="vehicleDetails.model"
                        placeholder="e.g., Model 3, i3, Leaf"
                        value={form.vehicleDetails.model}
                        onChange={handleChange}
                        className={`h-12 transition-all duration-200 ${
                          validationErrors["vehicleDetails.model"]
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        }`}
                      />
                      {validationErrors["vehicleDetails.model"] && (
                        <p className="text-sm text-red-600">{validationErrors["vehicleDetails.model"]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-sm font-medium text-gray-700">
                        Year
                      </Label>
                      <Input
                        id="year"
                        name="vehicleDetails.year"
                        type="number"
                        placeholder="2023"
                        value={form.vehicleDetails.year || ""}
                        onChange={handleChange}
                        className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Connector Selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Primary Connector Type *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {connectorTypes.map((connector) => (
                        <Card
                          key={connector.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            form.vehicleDetails.primaryConnector === connector.id
                              ? "ring-2 ring-emerald-500 bg-emerald-50"
                              : "hover:border-emerald-300"
                          }`}
                          onClick={() => handleConnectorSelect(connector.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">{connector.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">{connector.name}</h4>
                                  {connector.popular && (
                                    <Badge variant="secondary" className="text-xs">
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{connector.description}</p>
                              </div>
                              {form.vehicleDetails.primaryConnector === connector.id && (
                                <Check className="w-5 h-5 text-emerald-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {validationErrors["vehicleDetails.primaryConnector"] && (
                      <p className="text-sm text-red-600">{validationErrors["vehicleDetails.primaryConnector"]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="speed" className="text-sm font-medium text-gray-700">
                      Max Charging Speed (kW)
                    </Label>
                    <Input
                      id="speed"
                      name="vehicleDetails.maxChargingSpeed"
                      type="number"
                      placeholder="150"
                      value={form.vehicleDetails.maxChargingSpeed || ""}
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adapters" className="text-sm font-medium text-gray-700">
                      Additional Adapters
                    </Label>
                    <Input
                      id="adapters"
                      name="vehicleDetails.adapters"
                      placeholder="e.g., Type 1, J1772 (comma separated)"
                      value={form.vehicleDetails.adapters?.join(", ") || ""}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          vehicleDetails: {
                            ...prev.vehicleDetails,
                            adapters: e.target.value.split(",").map(v => v.trim()).filter(Boolean),
                          },
                        }))
                      }
                      className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="networks" className="text-sm font-medium text-gray-700">
                        Preferred Networks
                      </Label>
                      <Input
                        id="networks"
                        name="preferences.preferredNetworks"
                        placeholder="e.g., Tesla, ChargePoint, EVgo"
                        value={form.preferences?.preferredNetworks?.join(", ") || ""}
                        onChange={handleChange}
                        className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amenities" className="text-sm font-medium text-gray-700">
                        Required Amenities
                      </Label>
                      <Input
                        id="amenities"
                        name="preferences.requiredAmenities"
                        placeholder="e.g., WiFi, Restrooms, Food"
                        value={form.preferences?.requiredAmenities?.join(", ") || ""}
                        onChange={handleChange}
                        className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h3>
                    <p className="text-gray-600">
                      Welcome to ChargeConnect! We're finding the best charging stations for your {form.vehicleDetails.make}{" "}
                      {form.vehicleDetails.model}.
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

          {/* Navigation Buttons */}
          {currentStep < 3 && (
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {currentStep === 2 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold px-8 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Setting up...</span>
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
                  disabled={!canProceedToNext()}
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
