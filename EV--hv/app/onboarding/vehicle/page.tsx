"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Zap, Car, Gauge, Battery, PlugZap, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import MapTunisia, { STATIONS } from "@/components/map/tunisia-map"
import { cn } from "@/lib/utils"

const vehicleDetailsSchema = z.object({
  make: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  year: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 1990 && v <= new Date().getFullYear() + 1), {
      message: "Enter a valid year",
    }),
  primaryConnector: z.enum(["Type 2", "CCS", "CHAdeMO", "Tesla"], { required_error: "Select a connector" }),
  maxChargingSpeed: z
    .string()
    .min(1, "Required")
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0 && v <= 350, { message: "Enter kW between 1 and 350" }),
  // Not part of the DB schema but needed for ETA calculation and UX:
  batteryCapacityKwh: z
    .string()
    .min(1, "Required")
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 10 && v <= 200, { message: "Enter kWh between 10 and 200" }),
  currentSoC: z
    .string()
    .min(1, "Required")
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0 && v <= 100, { message: "Enter % between 0 and 100" }),
})

type FormValues = z.infer<typeof vehicleDetailsSchema>

function formatEtaMinutes(mins: number) {
  if (!Number.isFinite(mins) || mins <= 0) return "-"
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h <= 0) return `${m} min`
  return `${h}h ${m}m`
}

export default function VehicleOnboardingPage({
  // default props (for Next.js preview)
}: {
  defaultMake?: string
}) {
  const router = useRouter()
  const [submitted, setSubmitted] = useState<FormValues | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(vehicleDetailsSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      primaryConnector: undefined as any,
      maxChargingSpeed: "" as any,
      batteryCapacityKwh: "" as any,
      currentSoC: "30" as any,
    },
  })

  function onSubmit(data: FormValues) {
    // Simulate saving owner + vehicleDetails (would POST to API in real app)
    try {
      localStorage.setItem("cc_vehicle_details", JSON.stringify(data))
    } catch {}
    setSubmitted(data)
    // Optionally route to a dashboard:
    // router.push("/dashboard/driver")
  }

  const compatibleStations =
    submitted == null
      ? []
      : STATIONS.filter(
          (s) => s.connectors.includes(submitted.primaryConnector) && s.speedKw > 0
        )
          .map((s) => {
            const effectiveKw = Math.min(s.speedKw, submitted.maxChargingSpeed)
            const energyNeeded = submitted.batteryCapacityKwh * (1 - submitted.currentSoC / 100)
            const hours = energyNeeded > 0 && effectiveKw > 0 ? energyNeeded / effectiveKw : Infinity
            const minutes = hours * 60
            return { ...s, effectiveKw, etaMinutes: minutes }
          })
          .sort((a, b) => {
            // Prefer higher effective kW and then rating
            if (b.effectiveKw !== a.effectiveKw) return b.effectiveKw - a.effectiveKw
            return b.rating - a.rating
          })
          .slice(0, 6)

  // Map defaults
  const defaultMinKw: "any" | "22" | "50" | "150" | "250" =
    submitted?.maxChargingSpeed
      ? submitted.maxChargingSpeed >= 250
        ? "150"
        : submitted.maxChargingSpeed >= 150
        ? "50"
        : submitted.maxChargingSpeed >= 50
        ? "22"
        : "any"
      : "any"

  return (
    <div className="min-h-screen relative">
      {/* Gradient hints */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-10 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-50" />
        <div className="absolute top-40 -right-10 h-96 w-96 rounded-full bg-emerald-200 blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center shadow-sm">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Vehicle setup</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Personalize matches</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-emerald-600" />
                Tell us about your EV
              </CardTitle>
              <CardDescription>We’ll tailor stations and estimates to your car</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input id="make" placeholder="Tesla, Nissan..." {...register("make")} aria-invalid={!!errors.make} />
                    {errors.make && <p className="text-xs text-red-600">{errors.make.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="Model 3, Leaf..." {...register("model")} aria-invalid={!!errors.model} />
                    {errors.model && <p className="text-xs text-red-600">{errors.model.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" placeholder="2022" {...register("year")} aria-invalid={!!errors.year} />
                    {errors.year && <p className="text-xs text-red-600">{errors.year.message as any}</p>}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="primaryConnector">Primary connector</Label>
                    <select
                      id="primaryConnector"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      {...register("primaryConnector")}
                      aria-invalid={!!errors.primaryConnector}
                    >
                      <option value="" disabled>
                        Select connector
                      </option>
                      <option value="Type 2">Type 2</option>
                      <option value="CCS">CCS</option>
                      <option value="CHAdeMO">CHAdeMO</option>
                      <option value="Tesla">Tesla</option>
                    </select>
                    {errors.primaryConnector && (
                      <p className="text-xs text-red-600">{errors.primaryConnector.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxChargingSpeed">Vehicle max charging speed (kW)</Label>
                    <Input
                      id="maxChargingSpeed"
                      placeholder="e.g. 150"
                      {...register("maxChargingSpeed")}
                      aria-invalid={!!errors.maxChargingSpeed}
                    />
                    {errors.maxChargingSpeed && (
                      <p className="text-xs text-red-600">{errors.maxChargingSpeed.message as any}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batteryCapacityKwh">Battery capacity (kWh)</Label>
                    <Input
                      id="batteryCapacityKwh"
                      placeholder="e.g. 75"
                      {...register("batteryCapacityKwh")}
                      aria-invalid={!!errors.batteryCapacityKwh}
                    />
                    {errors.batteryCapacityKwh && (
                      <p className="text-xs text-red-600">{errors.batteryCapacityKwh.message as any}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentSoC">Current battery level: <span className="font-medium">{' '}</span></Label>
                  <div className="flex items-center gap-3">
                    <Battery className="h-4 w-4 text-emerald-600" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      defaultValue={30}
                      className="w-full"
                      {...register("currentSoC")}
                    />
                    <span className="text-sm tabular-nums">{/* filled by browser value bubble visually */}</span>
                  </div>
                  {errors.currentSoC && <p className="text-xs text-red-600">{errors.currentSoC.message as any}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <PlugZap className="h-3.5 w-3.5" />
                    We match connector, speed and show ETA to 100%
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                    {isSubmitting ? "Saving..." : "Show compatible stations"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card className={cn(submitted ? "" : "opacity-60")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-emerald-600" />
                  Nearest compatible stations
                </CardTitle>
                <CardDescription>
                  Filtered by your connector and vehicle capabilities{submitted ? "" : " (fill the form to personalize)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant="secondary">{submitted.make} {submitted.model}{submitted.year ? ` · ${submitted.year}` : ""}</Badge>
                      <Badge variant="secondary">{submitted.primaryConnector}</Badge>
                      <Badge variant="secondary">{submitted.maxChargingSpeed} kW max</Badge>
                      <Badge variant="secondary">{submitted.batteryCapacityKwh} kWh</Badge>
                      <Badge variant="secondary">{submitted.currentSoC}% now</Badge>
                    </div>

                    <div className="grid gap-3">
                      {compatibleStations.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-gray-600">{s.city} • {s.connectors.join(", ")} • {s.speedKw} kW</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              <span className="text-emerald-700 font-medium">{s.effectiveKw}</span> kW effective
                            </div>
                            <div className="text-xs text-gray-600">ETA to full: {formatEtaMinutes(s.etaMinutes)}</div>
                          </div>
                        </div>
                      ))}
                      {compatibleStations.length === 0 && (
                        <div className="text-sm text-gray-600">No matches yet. Try a different connector or speed.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">
                    Complete your vehicle details to see tailored results.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Interactive Map
                </CardTitle>
                <CardDescription>Tap a pin to see details and navigation</CardDescription>
              </CardHeader>
              <CardContent>
                <MapTunisia
                  height={420}
                  defaultConnector={submitted?.primaryConnector ?? "all"}
                  defaultMinKw={submitted ? defaultMinKw : "any"}
                  batteryCapacityKwh={submitted?.batteryCapacityKwh ?? 60}
                  currentSoC={submitted?.currentSoC ?? 30}
                  vehicleMaxKw={submitted?.maxChargingSpeed ?? 150}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
