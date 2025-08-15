"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, MapPin, Zap, Phone, Navigation, X, CheckCircle, Battery, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { Reservation, Station } from "../types"

export default function ReservationCountdown({
  reservation,
  station,
}: {
  reservation: Reservation
  station: Station
}) {
  const [remaining, setRemaining] = useState<number>(
    Math.max(0, new Date(reservation.expiresAt).getTime() - Date.now()),
  )
  const [sessionStatus, setSessionStatus] = useState<"reserved" | "active" | "completed">("reserved")
  const [chargingProgress, setChargingProgress] = useState(25) // Current battery level
  const [chargingSpeed, setChargingSpeed] = useState(0)
  const [energyDelivered, setEnergyDelivered] = useState(0)
  const [currentCost, setCurrentCost] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const newRemaining = Math.max(0, new Date(reservation.expiresAt).getTime() - Date.now())
      setRemaining(newRemaining)

      // Simulate charging progress if session is active
      if (sessionStatus === "active") {
        setChargingProgress((prev) => Math.min(80, prev + 0.1)) // Slowly increase to target
        setChargingSpeed(Math.random() * 20 + 130) // Simulate varying speed
        setEnergyDelivered((prev) => prev + 0.05)
        setCurrentCost((prev) => prev + 0.02)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [reservation.expiresAt, sessionStatus])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const progressPercentage = ((chargingProgress - 25) / (80 - 25)) * 100

  const handleStartCharging = () => {
    setSessionStatus("active")
  }

  const handleStopCharging = () => {
    setSessionStatus("completed")
  }

  const handleCancelReservation = () => {
    // Handle cancellation logic
    window.location.reload()
  }

  const connector = station.connectors.find((c) => c.id === reservation.chargerId)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div
          className={`p-6 text-white ${
            sessionStatus === "reserved"
              ? "bg-gradient-to-r from-blue-500 to-indigo-500"
              : sessionStatus === "active"
                ? "bg-gradient-to-r from-emerald-500 to-lime-500"
                : "bg-gradient-to-r from-green-500 to-emerald-500"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {sessionStatus === "reserved" ? (
                  <Clock className="w-6 h-6" />
                ) : sessionStatus === "active" ? (
                  <Zap className="w-6 h-6" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {sessionStatus === "reserved"
                    ? "Reservation Active"
                    : sessionStatus === "active"
                      ? "Charging in Progress"
                      : "Charging Complete"}
                </h2>
                <p className="text-white/80">{station.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelReservation}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {sessionStatus === "reserved" && (
            <div className="bg-white/20 rounded-xl p-4">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold mb-2">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </div>
                <p className="text-white/80">Time remaining to claim your charger</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Charging Progress (Active Session) */}
          {sessionStatus === "active" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Battery className="w-5 h-5" />
                  <span>Charging Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">{chargingProgress.toFixed(0)}%</div>
                  <Progress value={progressPercentage} className="h-3 mb-2" />
                  <p className="text-sm text-gray-600">
                    {chargingProgress.toFixed(0)}% → 80% ({(80 - chargingProgress).toFixed(0)}% remaining)
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{chargingSpeed.toFixed(0)} kW</div>
                    <div className="text-sm text-gray-600">Current Speed</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">{energyDelivered.toFixed(1)} kWh</div>
                    <div className="text-sm text-gray-600">Energy Added</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{currentCost.toFixed(2)} TND</div>
                    <div className="text-sm text-gray-600">Current Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Station Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Station Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Location</span>
                <span className="font-medium text-right">{station.address}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Charger</span>
                <Badge className="bg-emerald-100 text-emerald-700">
                  {connector?.type} • {connector?.power}kW
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Network</span>
                <span className="font-medium">{station.network}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pricing</span>
                <span className="font-medium">{station.pricing}</span>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Timer className="w-5 h-5" />
                <span>Session Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Reservation ID</span>
                <span className="font-mono text-sm">{reservation.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">
                  {reservation.paymentMethod === "Visa" ? "Visa ••••4242" : "Pay at Station"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Battery</span>
                <span className="font-medium">{reservation.batteryTarget || 80}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estimated Cost</span>
                <span className="font-medium text-emerald-600">{reservation.estimatedCost} TND</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                  <Phone className="w-4 h-4" />
                  <span>Call Station</span>
                </Button>
              </div>

              <Separator />

              {sessionStatus === "reserved" && (
                <div className="space-y-3">
                  <Button
                    onClick={handleStartCharging}
                    className="w-full bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-700 hover:to-lime-700 text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Charging
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelReservation}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Reservation
                  </Button>
                </div>
              )}

              {sessionStatus === "active" && (
                <Button
                  onClick={handleStopCharging}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Charging
                </Button>
              )}

              {sessionStatus === "completed" && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-green-900 mb-1">Charging Complete!</h4>
                  <p className="text-sm text-green-700">Your vehicle is ready to go.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
