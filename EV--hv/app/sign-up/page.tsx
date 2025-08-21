"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Zap,
  Car,
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Battery,
  CheckCircle2,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Spotlight from "@/components/creative/spotlight"
import TiltCard from "@/components/creative/tilt-card"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"
import { FaGoogle, FaFacebook } from "react-icons/fa"
import { CONNECTOR_TYPES } from "@/app/shared/connectors"

function passwordScore(pw: string) {
  let score = 0
  if (pw.length >= 8) score += 20
  if (pw.length >= 12) score += 20
  if (/[a-z]/.test(pw)) score += 15
  if (/[A-Z]/.test(pw)) score += 15
  if (/\d/.test(pw)) score += 15
  if (/[^A-Za-z0-9]/.test(pw)) score += 15
  return Math.min(100, score)
}

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = (searchParams.get("type") as "driver" | "owner") || "driver"
  const [userType, setUserType] = useState<"driver" | "owner">(defaultType)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const score = passwordScore(password)
  const scoreColor = score < 40 ? "bg-red-500" : score < 70 ? "bg-amber-500" : "bg-emerald-600"

  const [testimonials, setTestimonials] = useState<{ quote: string; name: string; role: string; avatar: string }[]>([
    {
      quote: "Loading reviews...",
      name: "",
      role: "",
      avatar: "/placeholder.svg?height=64&width=64",
    },
  ])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const reviews = await apiFetch("/reviews")
        setTestimonials(
          reviews.map((r: any) => ({
            quote: r.text || r.quote || "No review text",
            name: r.name || r.user || "Anonymous",
            role: r.role || "EV User",
            avatar: r.avatar || "/placeholder.svg?height=64&width=64",
          })),
        )
      } catch (err) {
        setTestimonials([
          {
            quote: "Failed to load reviews.",
            name: "",
            role: "",
            avatar: "/placeholder.svg?height=64&width=64",
          },
        ])
      }
    }
    fetchReviews()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 4200)
    return () => clearInterval(t)
  }, [testimonials.length])

  const [ownerForm, setOwnerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    businessName: "",
    businessType: "",
    phone: "",
    stationName: "",
    location: {
      type: "Point",
      coordinates: ["", ""], // [lng, lat]
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
    network: "",
  })
  const [driverForm, setDriverForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    carMake: "",
    carModel: "",
    batteryCapacity: "",
    primaryConnector: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (userType === "driver") {
      const email = driverForm.email.trim().toLowerCase()
      const payloadMissing =
        !driverForm.firstName.trim() ||
        !driverForm.lastName.trim() ||
        !email ||
        !driverForm.password ||
        !driverForm.carMake ||
        !driverForm.carModel ||
        !driverForm.primaryConnector ||
        !driverForm.batteryCapacity
      if (payloadMissing) {
        setError("Please fill in all required fields, including vehicle details.")
        return
      }
      try {
        await apiFetch("/car-owners/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: `${driverForm.firstName.trim()} ${driverForm.lastName.trim()}`,
            email,
            password: driverForm.password,
            vehicleDetails: {
              make: driverForm.carMake.trim(),
              model: driverForm.carModel.trim(),
              primaryConnector: driverForm.primaryConnector,
              batteryCapacity: Number(driverForm.batteryCapacity),
            },
          }),
        })
        setSuccess("Car owner account created!")
        setTimeout(() => router.push("/sign-in"), 600)
      } catch (err: any) {
        setError(err?.message || "Driver signup failed.")
      }
      return
    }

    // ---- Station Owner Branch ----
    const email = ownerForm.email.trim().toLowerCase()
    const stationName = ownerForm.stationName.trim()
    const network = (ownerForm.network || "Independent").trim()
    const pwd = ownerForm.password
    const lng = ownerForm.location.coordinates[0]
    const lat = ownerForm.location.coordinates[1]

    const missing: string[] = []
    if (!stationName) missing.push("stationName")
    if (!network) missing.push("network")
    if (!email) missing.push("email")
    if (!pwd) missing.push("password")
    if (!lng) missing.push("longitude")
    if (!lat) missing.push("latitude")

    if (missing.length) {
      setError("Missing: " + missing.join(", "))
      return
    }

    const lngNum = Number(lng)
    const latNum = Number(lat)
    if (!isFinite(lngNum) || !isFinite(latNum)) {
      setError("Coordinates must be numeric.")
      return
    }

    const payload = {
      stationName,
      network,
      email,
      password: pwd,
      ownerId: email,
      location: {
        type: "Point",
        coordinates: [lngNum, latNum],
      },
      address: {
        street: ownerForm.location.address?.trim() || "",
        city: ownerForm.location.city?.trim() || "",
        state: ownerForm.location.state?.trim() || "",
        zipCode: ownerForm.location.zipCode?.trim() || "",
      },
    }

    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "") +
          "/stations/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const ct = res.headers.get("content-type") || ""
      let data: any = null
      if (ct.includes("application/json")) data = await res.json()
      else {
        const txt = await res.text()
        setError("Unexpected response")
        console.error("Owner signup non-JSON:", txt.slice(0, 300))
        return
      }

      if (!res.ok) {
        setError(data?.msg || "Owner signup failed.")
        return
      }

      setSuccess("Owner account created.")
      localStorage.setItem("ownerId", data._id || payload.ownerId)
      setTimeout(() => router.push("/sign-in"), 600)
    } catch (e: any) {
      console.error("[ownerSignup] error:", e)
      setError(e.message || "Network error")
    }
  }

  useEffect(() => {
    if (!ownerForm.network) {
      setOwnerForm(o => ({ ...o, network: "Independent" }))
    }
  }, [])

  return (
    <div className="min-h-screen relative">
      {/* Enhanced Gradient Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-16 h-96 w-96 rounded-full bg-gradient-to-br from-lime-200 to-lime-300 blur-3xl opacity-60" />
        <div className="absolute top-32 -right-16 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-emerald-200 to-emerald-300 blur-3xl opacity-60" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-amber-100 to-amber-200 blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-teal-200 to-cyan-200 blur-3xl opacity-40" />
      </div>

      <Spotlight className="relative">
        <div className="container mx-auto px-4 md:px-6 py-8 lg:py-12">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8 lg:mb-12">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-lime-500 via-emerald-500 to-emerald-600 grid place-items-center shadow-lg shadow-emerald-500/25">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-gray-900">ChargeConnect</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-medium">Smart EV Network</div>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" className="text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 px-6">
                ← Back to Home
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Enhanced Left Panel */}
            <div className="flex flex-col space-y-6">
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-4 py-2 text-sm font-medium">
                  ⭐ People love the onboarding
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    Join the future of{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-lime-600">
                      smart charging
                    </span>
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Connect with the most intelligent EV charging network in Tunisia
                  </p>
                </div>
              </div>

              <TiltCard className="bg-white/95 backdrop-blur-sm border border-gray-100 p-8 shadow-2xl shadow-gray-900/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl lg:text-2xl font-semibold leading-relaxed text-gray-900">
                  "{testimonials[idx].quote}"
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <img
                    src={testimonials[idx].avatar || "/placeholder.svg"}
                    alt={testimonials[idx].name}
                    className="h-14 w-14 rounded-full border-2 border-gray-100"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonials[idx].name}</div>
                    <div className="text-sm text-gray-600">{testimonials[idx].role}</div>
                  </div>
                </div>
              </TiltCard>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: Sparkles,
                    title: "2-min setup",
                    desc: "We guide the essentials.",
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    icon: Battery,
                    title: "Smart defaults",
                    desc: "Pre-filled for your EV.",
                    color: "from-emerald-500 to-teal-500",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Privacy-first",
                    desc: "Data stays safe.",
                    color: "from-blue-500 to-indigo-500",
                  },
                ].map((f, i) => (
                  <TiltCard
                    key={i}
                    className="bg-white/90 backdrop-blur-sm border border-gray-100 p-5 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} text-white grid place-items-center shadow-lg mb-4`}
                    >
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">{f.title}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{f.desc}</div>
                  </TiltCard>
                ))}
              </div>
            </div>

            {/* Enhanced Right Panel - Form */}
            <TiltCard className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-2xl shadow-gray-900/10">
              <Card className="border-none shadow-none">
                <CardHeader className="pb-6 px-8 pt-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-lime-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-2 text-sm font-medium w-fit">
                    <Sparkles className="h-4 w-4" />
                    Personalized matching
                  </div>
                  <CardTitle className="text-2xl lg:text-3xl mt-4 text-gray-900 font-bold">
                    Create your account
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    Join the smart EV charging network
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                  <Tabs value={userType} onValueChange={(v) => setUserType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-1 rounded-xl">
                      <TabsTrigger
                        value="driver"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <Car className="h-4 w-4" />
                        EV Driver
                      </TabsTrigger>
                      <TabsTrigger
                        value="owner"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <Building className="h-4 w-4" />
                        Station Owner
                      </TabsTrigger>
                    </TabsList>

                    {/* Enhanced Driver Form */}
                    <TabsContent value="driver" className="space-y-6 mt-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            Personal Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                                First Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="firstName"
                                value={driverForm.firstName}
                                onChange={(e) => setDriverForm({ ...driverForm, firstName: e.target.value })}
                                placeholder="John"
                                className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                                Last Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="lastName"
                                value={driverForm.lastName}
                                onChange={(e) => setDriverForm({ ...driverForm, lastName: e.target.value })}
                                placeholder="Doe"
                                className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={driverForm.email}
                              onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                              placeholder="john@example.com"
                              className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                              Password <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={driverForm.password}
                              onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                              placeholder="Strong password"
                              className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                              required
                            />
                          </div>
                        </div>

                        {/* Vehicle Information Section */}
                        <div className="bg-gradient-to-r from-emerald-50 to-lime-50 rounded-xl p-6 border border-emerald-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Car className="h-5 w-5 text-emerald-600" />
                            Vehicle Information
                          </h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="carMake" className="text-sm font-medium text-gray-700">
                                  Car Make <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={driverForm.carMake}
                                  onValueChange={(v) => setDriverForm({ ...driverForm, carMake: v })}
                                  required
                                >
                                  <SelectTrigger className="h-11 bg-white border-gray-200">
                                    <SelectValue placeholder="Select make" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Tesla">Tesla</SelectItem>
                                    <SelectItem value="Nissan">Nissan</SelectItem>
                                    <SelectItem value="BMW">BMW</SelectItem>
                                    <SelectItem value="Audi">Audi</SelectItem>
                                    <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                                    <SelectItem value="Hyundai">Hyundai</SelectItem>
                                    <SelectItem value="Kia">Kia</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="carModel" className="text-sm font-medium text-gray-700">
                                  Car Model <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="carModel"
                                  value={driverForm.carModel}
                                  onChange={(e) => setDriverForm({ ...driverForm, carModel: e.target.value })}
                                  placeholder="Model 3, Leaf, i3..."
                                  className="h-11 bg-white border-gray-200"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="batteryCapacity" className="text-sm font-medium text-gray-700">
                                  Battery Capacity (kWh) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="batteryCapacity"
                                  type="number"
                                  value={driverForm.batteryCapacity}
                                  onChange={(e) => setDriverForm({ ...driverForm, batteryCapacity: e.target.value })}
                                  placeholder="75"
                                  className="h-11 bg-white border-gray-200"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="primaryConnector" className="text-sm font-medium text-gray-700">
                                  Preferred Connector <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={driverForm.primaryConnector}
                                  onValueChange={(v) => setDriverForm({ ...driverForm, primaryConnector: v })}
                                  required
                                >
                                  <SelectTrigger className="h-11 bg-white border-gray-200">
                                    <SelectValue placeholder="Select connector" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CONNECTOR_TYPES.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 h-12 text-base font-semibold shadow-lg shadow-emerald-600/25"
                            type="submit"
                          >
                            Create Account
                          </Button>
                          {error && (
                            <div className="text-red-600 text-sm mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                              {error}
                            </div>
                          )}
                          {success && (
                            <div className="text-green-600 text-sm mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              {success}
                            </div>
                          )}
                        </div>
                      </form>
                    </TabsContent>

                    {/* Enhanced Owner Form */}
                    <TabsContent value="owner" className="space-y-6 mt-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            Personal Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ownerFirstName" className="text-sm font-medium text-gray-700">
                                First Name
                              </Label>
                              <Input
                                id="ownerFirstName"
                                placeholder="Jane"
                                className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                                value={ownerForm.firstName}
                                onChange={(e) => setOwnerForm({ ...ownerForm, firstName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ownerLastName" className="text-sm font-medium text-gray-700">
                                Last Name
                              </Label>
                              <Input
                                id="ownerLastName"
                                placeholder="Smith"
                                className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                                value={ownerForm.lastName}
                                onChange={(e) => setOwnerForm({ ...ownerForm, lastName: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ownerEmail" className="text-sm font-medium text-gray-700">
                              Email
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="ownerEmail"
                                type="email"
                                placeholder="jane@example.com"
                                className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                                value={ownerForm.email}
                                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ownerPassword" className="text-sm font-medium text-gray-700">
                              Password
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="ownerPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Strong password"
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value)
                                  setOwnerForm({ ...ownerForm, password: e.target.value })
                                }}
                                className="pl-10 pr-12 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-300 focus:ring-emerald-200"
                              />
                              <button
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <div className="mt-3">
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${scoreColor} transition-all duration-300`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {score < 40 ? "Weak" : score < 70 ? "Okay" : "Strong"} password
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Business Information Section */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Building className="h-5 w-5 text-blue-600" />
                            Business Information
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                                Business Name
                              </Label>
                              <Input
                                id="businessName"
                                value={ownerForm.businessName}
                                onChange={(e) => setOwnerForm({ ...ownerForm, businessName: e.target.value })}
                                placeholder="Green Energy Solutions"
                                className="h-11 bg-white border-gray-200"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="businessType" className="text-sm font-medium text-gray-700">
                                  Business Type
                                </Label>
                                <Select
                                  value={ownerForm.businessType}
                                  onValueChange={(v) => setOwnerForm({ ...ownerForm, businessType: v })}
                                >
                                  <SelectTrigger className="h-11 bg-white border-gray-200">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="individual">Individual Owner</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="government">Government</SelectItem>
                                    <SelectItem value="nonprofit">Non-profit</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                  Phone Number
                                </Label>
                                <Input
                                  id="phone"
                                  type="tel"
                                  placeholder="+1 (555) 123-4567"
                                  className="h-11 bg-white border-gray-200"
                                  value={ownerForm.phone}
                                  onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Station Information Section */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-emerald-600" />
                            Station Information
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="stationName" className="text-sm font-medium text-gray-700">
                                Station Name
                              </Label>
                              <Input
                                id="stationName"
                                value={ownerForm.stationName}
                                onChange={(e) => setOwnerForm({ ...ownerForm, stationName: e.target.value })}
                                placeholder="Main Street Station"
                                className="h-11 bg-white border-gray-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="network" className="text-sm font-medium text-gray-700">
                                Network <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="network"
                                value={ownerForm.network}
                                onChange={(e) => setOwnerForm({ ...ownerForm, network: e.target.value })}
                                placeholder="e.g., Independent, ChargePoint"
                                className="h-11 bg-white border-gray-200"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="locationAddress" className="text-sm font-medium text-gray-700">
                                  Location Address
                                </Label>
                                <Input
                                  id="locationAddress"
                                  value={ownerForm.location.address}
                                  onChange={(e) =>
                                    setOwnerForm({
                                      ...ownerForm,
                                      location: { ...ownerForm.location, address: e.target.value },
                                    })
                                  }
                                  placeholder="123 Main St"
                                  className="h-11 bg-white border-gray-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="locationCity" className="text-sm font-medium text-gray-700">
                                  City
                                </Label>
                                <Input
                                  id="locationCity"
                                  value={ownerForm.location.city}
                                  onChange={(e) =>
                                    setOwnerForm({
                                      ...ownerForm,
                                      location: { ...ownerForm.location, city: e.target.value },
                                    })
                                  }
                                  placeholder="Tunis"
                                  className="h-11 bg-white border-gray-200"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="locationLat" className="text-sm font-medium text-gray-700">
                                  Latitude
                                </Label>
                                <Input
                                  id="locationLat"
                                  value={ownerForm.location.coordinates[1]}
                                  onChange={(e) =>
                                    setOwnerForm({
                                      ...ownerForm,
                                      location: {
                                        ...ownerForm.location,
                                        coordinates: [ownerForm.location.coordinates[0], e.target.value],
                                      },
                                    })
                                  }
                                  placeholder="36.8065"
                                  className="h-11 bg-white border-gray-200"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="locationLng" className="text-sm font-medium text-gray-700">
                                  Longitude
                                </Label>
                                <Input
                                  id="locationLng"
                                  value={ownerForm.location.coordinates[0]}
                                  onChange={(e) =>
                                    setOwnerForm({
                                      ...ownerForm,
                                      location: {
                                        ...ownerForm.location,
                                        coordinates: [e.target.value, ownerForm.location.coordinates[1]],
                                      },
                                    })
                                  }
                                  placeholder="10.1815"
                                  className="h-11 bg-white border-gray-200"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                          />
                          <label className="text-sm text-gray-600 leading-relaxed">
                            I agree to the{" "}
                            <Link href="#" className="text-emerald-700 hover:underline font-medium">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="#" className="text-emerald-700 hover:underline font-medium">
                              Privacy Policy
                            </Link>
                            .
                          </label>
                        </div>

                        <div className="space-y-4">
                          <Button
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 h-12 text-base font-semibold shadow-lg shadow-emerald-600/25"
                            type="submit"
                          >
                            Create Account
                          </Button>

                          {error && (
                            <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                              {error}
                            </div>
                          )}
                          {success && (
                            <div className="text-green-600 text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                              {success}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-11 bg-white hover:bg-gray-50 border-gray-200">
                              <FaGoogle className="h-4 w-4 mr-2 text-[#EA4335]" />
                              Google
                            </Button>
                            <Button variant="outline" className="h-11 bg-white hover:bg-gray-50 border-gray-200">
                              <FaFacebook
                                style={{ height: "1rem", width: "1rem", marginRight: "0.5rem", color: "#1877F3" }}
                              />
                              Facebook
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <p className="text-sm text-emerald-700">
                              You can add more stations later in your dashboard.
                            </p>
                          </div>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TiltCard>
          </div>
        </div>
      </Spotlight>
    </div>
  )
}
