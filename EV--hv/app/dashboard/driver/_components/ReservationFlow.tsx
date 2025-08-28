"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Wallet, Clock, Zap, MapPin, Check, ArrowLeft, Star, Shield, Calculator, Timer, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ReservationCountdown from "./ReservationCountdown"
import type { Station, Reservation, CarOwner } from "../types"

// HELPER: parse price strings like "0.30 / kWh" or "$0.45/kWh"
function parsePricePerKwh(priceString?: string): number {
  if (!priceString) return 0.3
  const match = priceString.match(/(\d+\.?\d*)\s*\/?\s*kWh/i)
  if (match) return parseFloat(match[1])
  // try to extract number anywhere
  const anyNum = priceString.match(/(\d+\.?\d*)/)
  return anyNum ? parseFloat(anyNum[1]) : 0.3
}

const api = {
  createReservation: async (reservationData: {
    userId: string
    carId: string
    stationId: string
    connectorId: string
    startTime: string
    endTime: string
  }): Promise<Reservation> => {
    const res = await fetch("http://localhost:5000/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reservationData),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.msg || `Reservation failed (HTTP ${res.status})`)
    }
    return await res.json()
  },
  getEstimates: async (stationId: string, chargerId: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      cost: 12.5,
      duration: 45,
      energyNeeded: 25,
      peakPower: 150,
    }
  },
}

export default function ReservationFlow({
  station,
  chargerId,
  user,
  onComplete,
}: {
  station: Station
  chargerId: string
  user: CarOwner
  onComplete?: (reservation?: Reservation | null) => void
}) {
  const [step, setStep] = useState<"details" | "payment" | "confirm" | "success">("details")
  const [paymentMethod, setPaymentMethod] = useState<"Visa" | "OnSite">("Visa")
  const [loading, setLoading] = useState(false)
  const [loadingEstimates, setLoadingEstimates] = useState(false)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [estimates, setEstimates] = useState({
    cost: 12.5,
    duration: 45,
    energyNeeded: 25,
    peakPower: 150,
  })
  const [batteryLevel, setBatteryLevel] = useState(25)
  const [targetLevel, setTargetLevel] = useState(80)
  // Added: card details state to prevent ReferenceError
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: user?.fullName || "",
  })
  // ERROR state
  const [error, setError] = useState<string | null>(null)

  // NEW: Scheduling state
  const initRounded = (() => {
    const d = new Date()
    const mins = d.getMinutes()
    const rounded = Math.ceil(mins / 15) * 15
    if (rounded === 60) {
      d.setHours(d.getHours() + 1)
      d.setMinutes(0, 0, 0)
    } else {
      d.setMinutes(rounded, 0, 0)
    }
    return d
  })()
  const [reservationDate, setReservationDate] = useState(
    initRounded.toISOString().slice(0, 10) // YYYY-MM-DD
  )
  const [reservationTime, setReservationTime] = useState(
    initRounded.toTimeString().slice(0, 5) // HH:MM
  )
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  // When vehicle details are missing, show friendly prompt and close safely
  // Guard: require vehicle details (use vehicleDetails instead of vehicle)
  if (!user?.vehicleDetails?.make) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg border">
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-800">Vehicle details required</h3>
            <p className="mt-2 text-sm text-gray-600">
              Vehicle details are missing. Please update your profile before creating a reservation.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                onClick={() => {
                  try {
                    onComplete?.(null)
                  } finally {
                    window.location.href = "/dashboard/driver?view=profile"
                  }
                }}
              >
                Update Profile
              </button>
              <button
                className="px-4 py-2 border rounded hover:bg-gray-50"
                onClick={() => onComplete?.(null)}
              >
                Close
              </button>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
        </div>
      </div>
    )
  }

  const connector = station.connectors.find((c) => c.id === chargerId)

  // Calculate estimates client-side based on vehicle & connector data
  React.useEffect(() => {
    if (step !== "details") return
    // require vehicle battery capacity and connector power to calculate
    const batteryCapacity = user?.vehicleDetails?.batteryCapacityKWh
    const connectorPower = connector?.power
    if (!batteryCapacity || !connectorPower) return

    setLoadingEstimates(true)

    const energyNeeded = ((targetLevel - batteryLevel) / 100) * batteryCapacity // kWh
    const duration = connectorPower > 0 ? (energyNeeded / connectorPower) * 60 : 0 // minutes
    const pricePerKwh = parsePricePerKwh(station.pricing)
    const cost = energyNeeded * pricePerKwh

    // small delay to smooth UX
    const t = setTimeout(() => {
      setEstimates({
        cost: parseFloat(cost.toFixed(2)),
        duration: Math.max(1, Math.round(duration)),
        energyNeeded: parseFloat(energyNeeded.toFixed(1)),
        peakPower: connectorPower,
      })
      setLoadingEstimates(false)
    }, 500)

    return () => clearTimeout(t)
  }, [
    step,
    station.id,
    chargerId,
    batteryLevel,
    targetLevel,
    user?.vehicleDetails?.batteryCapacityKWh,
    connector?.power,
    station.pricing,
  ])

  // Derived scheduled Date objects for summary & validation
  const scheduledStart = React.useMemo(
    () => new Date(`${reservationDate}T${reservationTime}:00`),
    [reservationDate, reservationTime]
  )
  const scheduledEnd = React.useMemo(
    () => new Date(scheduledStart.getTime() + durationMinutes * 60_000),
    [scheduledStart, durationMinutes]
  )

  function formatDT(d: Date) {
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function handleConfirm() {
    const vehicle = user?.vehicleDetails || (user as any).vehicle
    if (!user || !vehicle) return setError("User or vehicle details are missing.")
    const carId = vehicle.id || vehicle._id || vehicle.vehicleId
    if (!carId) return setError("Missing vehicle ID. Update your profile.")
    const stationId = (station as any).id || (station as any)._id
    if (!stationId) return setError("Station identifier missing.")

    if (isNaN(scheduledStart.getTime())) {
      setError("Invalid scheduled start time.")
      return
    }
    if (scheduledStart.getTime() < Date.now() - 60_000) {
      setError("Scheduled start time is in the past.")
      return
    }
    if (durationMinutes < 5) {
      setError("Minimum duration is 5 minutes.")
      return
    }

    const startTime = scheduledStart.toISOString()
    const endTime = scheduledEnd.toISOString()

    setLoading(true)
    setError(null)
    try {
      const newRes = await api.createReservation({
        userId: user.id,
        carId,
        stationId,
        connectorId: chargerId,
        startTime,
        endTime,
      })
      setReservation(newRes)
      setStep("success")
    } catch (e: any) {
      setError(e?.message || "Reservation failed.")
    } finally {
      setLoading(false)
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  if (step === "success" && reservation) {
    return <ReservationCountdown reservation={reservation} station={station} />
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-lime-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (step === "details") {
                  onComplete?.(null) // Close modal safely
                } else if (step === "payment") {
                  setStep("details")
                } else if (step === "confirm") {
                  setStep("payment")
                }
              }}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${step === "details" ? "bg-white" : "bg-white/40"}`} />
              <div className={`w-2 h-2 rounded-full ${step === "payment" ? "bg-white" : "bg-white/40"}`} />
              <div className={`w-2 h-2 rounded-full ${step === "confirm" ? "bg-white" : "bg-white/40"}`} />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Reserve Charger</h2>
              <p className="text-white/80">{station.name}</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div key="details" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                <div className="space-y-6">
                  {/* Station Info */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{station.address}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className="bg-emerald-100 text-emerald-700">
                              {connector?.type} • {connector?.power}kW
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">4.5 (127 reviews)</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-emerald-600">{station.pricing}</div>
                          <div className="text-sm text-gray-500">per kWh</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Battery Level Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calculator className="w-5 h-5" />
                        <span>Charging Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Current Battery Level</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={batteryLevel}
                              onChange={(e) => setBatteryLevel(Number(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12">{batteryLevel}%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Target Level</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="range"
                              min={batteryLevel}
                              max="100"
                              value={targetLevel}
                              onChange={(e) => setTargetLevel(Number(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12">{targetLevel}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Charging Progress</span>
                          <span className="text-sm font-medium">{targetLevel - batteryLevel}% needed</span>
                        </div>
                        <Progress value={((targetLevel - batteryLevel) / 100) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estimates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Timer className="w-5 h-5" />
                        <span>Charging Estimates</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingEstimates ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                          <span className="ml-3 text-gray-600">Calculating estimates...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <div className="text-2xl font-bold text-emerald-600">{estimates.duration}min</div>
                            <div className="text-sm text-gray-600">Charging Time</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{estimates.cost} TND</div>
                            <div className="text-sm text-gray-600">Estimated Cost</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{estimates.energyNeeded} kWh</div>
                            <div className="text-sm text-gray-600">Energy Needed</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{estimates.peakPower} kW</div>
                            <div className="text-sm text-gray-600">Peak Power</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Scheduling Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>Schedule</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="resDate">Date</Label>
                          <Input
                            id="resDate"
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={reservationDate}
                            onChange={(e) => setReservationDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="resTime">Start Time</Label>
                          <Input
                            id="resTime"
                            type="time"
                            step={900}
                            value={reservationTime}
                            onChange={(e) => setReservationTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (min)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="5"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      {scheduleError && <div className="text-sm text-red-600">{scheduleError}</div>}
                    </CardContent>
                  </Card>

                  <Button
                    onClick={() => setStep("payment")}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold"
                    disabled={loadingEstimates}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div key="payment" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Choose Payment Method</h3>
                    <div className="space-y-3">
                      <Card
                        className={`cursor-pointer transition-all duration-200 ${
                          paymentMethod === "Visa"
                            ? "ring-2 ring-emerald-500 bg-emerald-50"
                            : "hover:border-emerald-300"
                        }`}
                        onClick={() => setPaymentMethod("Visa")}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Credit/Debit Card</h4>
                              <p className="text-sm text-gray-500">Visa, Mastercard, or saved payment methods</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <Shield className="w-3 h-3 mr-1" />
                                Secure
                              </Badge>
                              {paymentMethod === "Visa" && <Check className="w-5 h-5 text-emerald-500" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all duration-200 ${
                          paymentMethod === "OnSite"
                            ? "ring-2 ring-emerald-500 bg-emerald-50"
                            : "hover:border-emerald-300"
                        }`}
                        onClick={() => setPaymentMethod("OnSite")}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                              <Wallet className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Pay at Station</h4>
                              <p className="text-sm text-gray-500">Pay directly at the charging station</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                Cash/Card
                              </Badge>
                              {paymentMethod === "OnSite" && <Check className="w-5 h-5 text-emerald-500" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {paymentMethod === "Visa" && (
                    <>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <div>
                              <h5 className="font-medium text-blue-900">Saved Payment Method</h5>
                              <p className="text-sm text-blue-700">Visa ending in 4242 • Expires 12/25</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <motion.div
                        key="card-details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 pt-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="cardNumber"
                                placeholder="•••• •••• •••• ••••"
                                value={cardDetails.number}
                                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              value={cardDetails.expiry}
                              onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="cvc"
                                placeholder="•••"
                                value={cardDetails.cvc}
                                onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="name">Cardholder Name</Label>
                            <Input
                              id="name"
                              placeholder="John Doe"
                              value={cardDetails.name}
                              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}

                  <Button
                    onClick={() => setStep("confirm")}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold"
                  >
                    Continue to Confirmation
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div key="confirm" variants={stepVariants} initial="hidden" animate="visible" exit="exit">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Confirm Your Reservation</h3>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reservation Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Station</span>
                        <span className="font-medium">{station.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Charger</span>
                        <Badge>
                          {connector?.type} • {connector?.power}kW
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Battery Level</span>
                        <span className="font-medium">
                          {batteryLevel}% → {targetLevel}%
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Scheduled Start</span>
                        <span className="font-medium">{formatDT(scheduledStart)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Scheduled End</span>
                        <span className="font-medium">{formatDT(scheduledEnd)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{durationMinutes} min</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Estimated Charging Time</span>
                        <span className="font-medium">{estimates.duration} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Estimated Cost</span>
                        <span className="font-medium text-emerald-600">{estimates.cost} TND</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Method</span>
                        <span className="font-medium">
                          {paymentMethod === "Visa" ? "Visa ••••4242" : "Pay at Station"}
                        </span>
                      </div>
                      {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                          {error}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-amber-900 mb-1">Reservation Terms</h5>
                          <ul className="text-sm text-amber-800 space-y-1">
                            <li>• Your slot starts at {formatDT(scheduledStart)}</li>
                            <li>• Please arrive before the scheduled start to avoid auto-cancellation</li>
                            <li>• Session auto-ends at {formatDT(scheduledEnd)} if not started</li>
                            <li>• Cancellation free until charging begins</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleConfirm}
                    disabled={loading || isNaN(scheduledStart.getTime())}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Confirming Reservation...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm Reservation
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
