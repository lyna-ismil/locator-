"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Wallet, Clock, Zap, MapPin, Check, ArrowLeft, Star, Shield, Calculator, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import ReservationCountdown from "./ReservationCountdown"
import type { Station, Reservation } from "../types"

const api = {
  createReservation: async (
    userId: string,
    carId: string,
    stationId: string,
    connectorId: string,
    startTime: string,
    endTime: string,
    paymentMethod: "Visa" | "OnSite"
  ): Promise<Reservation> => {
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
    });
    if (!res.ok) throw new Error("Reservation failed");
    return await res.json();
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
  onComplete: (reservation: Reservation) => void
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

  React.useEffect(() => {
    if (step === "details") {
      setLoadingEstimates(true)
      api.getEstimates(station.id, chargerId).then((data) => {
        setEstimates(data)
        setLoadingEstimates(false)
      })
    }
  }, [step, station.id, chargerId])

  const connector = station.connectors.find((c) => c.id === chargerId)

  async function handleConfirm() {
    setLoading(true)
    try {
      // Calculate start and end time for reservation
      const startTime = new Date().toISOString()
      const endTime = new Date(Date.now() + estimates.duration * 60 * 1000).toISOString()
      // Send all required info to backend
      const res = await api.createReservation(
        user.id,
        user.vehicleDetails?.id || "", // If your vehicle has an id, otherwise pass ""
        station.id,
        chargerId,
        startTime,
        endTime,
        paymentMethod
      )
      setReservation(res)
      setStep("success")
      onComplete(res)
    } catch (error) {
      console.error("Reservation failed:", error)
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
                  onComplete(null as any) // Close modal
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

                  {/* Reservation Summary */}
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
                        <span className="text-gray-600">Estimated Duration</span>
                        <span className="font-medium">{estimates.duration} minutes</span>
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
                    </CardContent>
                  </Card>

                  {/* Reservation Terms */}
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-amber-900 mb-1">Reservation Terms</h5>
                          <ul className="text-sm text-amber-800 space-y-1">
                            <li>• Reservation expires in 15 minutes</li>
                            <li>• Cancellation is free until you start charging</li>
                            <li>• Actual costs may vary based on charging speed</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleConfirm}
                    disabled={loading}
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
