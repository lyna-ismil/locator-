"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation" // <- added useSearchParams
import { Zap, Mail, Lock, Eye, EyeOff, Star, CheckCircle2, Shield, Sparkles } from "lucide-react"
import { FaGoogle, FaFacebook } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Spotlight from "@/components/creative/spotlight"
import TiltCard from "@/components/creative/tilt-card"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"

/* ---------------- Helper utilities ---------------- */
function extractId(r: any) {
  if (r?.station?._id || r?.station?.id) return r.station._id || r.station.id
  if (r?.user?._id || r?.user?.id) return r.user._id || r.user.id
  return r?.userId || r?._id || r?.id
}

function isStationResponse(r: any) {
  return !!r?.station && (r.station._id || r.station.id)
}

function normalizeUser(raw: any) {
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
      primaryConnector: "",
      adapters: [],
    },
    preferences: u.preferences || { preferredNetworks: [], requiredAmenities: [] },
  }
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // role decided ONLY by query param ?role=driver or ?role=owner (default owner)
  const role = (searchParams.get("role") === "driver" ? "driver" : "owner") as "driver" | "owner"

  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const [testimonials, setTestimonials] = useState<{ quote: string; name: string; role: string; avatar: string }[]>([
    { quote: "Loading reviews...", name: "", role: "", avatar: "/placeholder.svg?height=64&width=64" },
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
          }))
        )
      } catch {
        setTestimonials([{ quote: "Failed to load reviews.", name: "", role: "", avatar: "/placeholder.svg" }])
      }
    }
    fetchReviews()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 4000)
    return () => clearInterval(t)
  }, [testimonials.length])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.id]: e.target.value })
    setError("")
    setSuccess("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError("")
    setSuccess("")
    setLoading(true)

    const email = form.email.trim().toLowerCase()
    const password = form.password
    if (!email || !password) {
      setError("Email and password required.")
      setLoading(false)
      return
    }

    const base = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")

    try {
      // Try Car Owner first
      const carRes = await fetch(`${base}/car-owners/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      let carData: any = null
      try { carData = await carRes.json() } catch (e) { /* ignore parse error */ }

      if (carRes.ok && carData?.user) {
        const driverId = carData.user._id || carData.user.id
        if (!driverId) {
          setError("Missing driver id in response.")
        } else {
          localStorage.setItem("authRole", "driver")
          localStorage.setItem("driverUserId", driverId)
          localStorage.setItem("driverUser", JSON.stringify(carData.user))
          localStorage.removeItem("ownerId")
          setSuccess("Signed in as driver")
          router.push("/dashboard/driver")
          return
        }
      }

      // If car owner attempt failed, try Station Owner
      const stationRes = await fetch(`${base}/stations/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      let stationData: any = null
      try { stationData = await stationRes.json() } catch (e) { /* ignore parse error */ }

      if (stationRes.ok && stationData?.station && stationData.station.ownerId) {
        const ownerId = stationData.station.ownerId
        localStorage.setItem("authRole", "owner")
        localStorage.setItem("ownerId", ownerId)
        localStorage.removeItem("driverUserId")
        localStorage.removeItem("driverUser")
        setSuccess("Signed in as station owner")
        router.push("/dashboard/owner")
        return
      }

      // Consolidate error message
      const msg = carData?.msg || stationData?.msg || "Invalid credentials. Please check your email and password."
      setError(msg)
    } catch (err: any) {
      setError(err?.message || "Sign-in failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-gradient-to-br from-lime-200 to-lime-300 blur-3xl opacity-60" />
        <div className="absolute top-32 -right-20 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-emerald-200 to-emerald-300 blur-3xl opacity-60" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-amber-100 to-amber-200 blur-3xl opacity-50" />
      </div>

      <Spotlight className="relative">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-lime-500 via-emerald-500 to-emerald-600 grid place-items-center shadow-lg">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-gray-900">ChargeConnect</div>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Smart EV Network</div>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" className="text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 px-6">
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
            <TiltCard className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-2xl">
              <Card className="border-none shadow-none rounded-2xl">
                <CardHeader className="pb-4 px-8 pt-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-lime-50 border border-emerald-200/50 text-emerald-700 rounded-full px-4 py-2 text-sm w-fit font-medium">
                    <Shield className="h-4 w-4" />
                    Secure sign in
                  </div>
                  <CardTitle className="text-3xl md:text-4xl mt-4 font-bold text-gray-900 leading-tight">
                    Welcome back
                  </CardTitle>
                  <p className="text-gray-600 mt-2">Sign in to access your charging dashboard</p>
                </CardHeader>
                <CardContent className="pt-0 px-8 pb-8">
                  <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-12 h-12 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl text-base"
                          value={form.email}
                          onChange={handleInputChange}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-12 pr-12 h-12 bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl text-base"
                          value={form.password}
                          onChange={handleInputChange}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm py-2">
                      <label className="flex items-center gap-3 text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <span className="font-medium">Remember me</span>
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={loading || !!success}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing In...
                        </div>
                      ) : success ? (
                        "Redirecting..."
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
                        {success}
                      </div>
                    )}

                    <div className="flex items-center gap-4 my-6">
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                      <span className="text-sm text-gray-500 font-medium px-2">or continue with</span>
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" type="button" className="h-12 bg-white border-gray-200 rounded-xl font-medium">
                        <span className="mr-3">
                          <FaGoogle size="1.1rem" />
                        </span>
                        Google
                      </Button>
                      <Button variant="outline" type="button" className="h-12 bg-white border-gray-200 rounded-xl font-medium">
                        <span className="mr-3">
                          <FaFacebook size="1.1rem" />
                        </span>
                        Facebook
                      </Button>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-4">
                      <p className="text-sm text-emerald-700 flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Your data is encrypted and protected — we never share your information.
                      </p>
                    </div>

                    <div className="text-center text-base text-gray-600 pt-4 border-t border-gray-100">
                      Don{"'"}t have an account?{" "}
                      <Link
                        href="/sign-up"
                        className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline transition-colors"
                      >
                        Create one
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TiltCard>

            <div className="flex flex-col space-y-6">
              <div className="mb-2">
                <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 px-4 py-2 text-sm font-medium border border-amber-200/50">
                  What people say
                </Badge>
              </div>

              <TiltCard className="bg-white/95 backdrop-blur-sm border border-gray-200/50 p-8 shadow-2xl rounded-2xl">
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-2xl md:text-3xl font-bold leading-snug text-gray-900 mb-8">
                  "{testimonials[idx].quote}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonials[idx].avatar || "/placeholder.svg"}
                    alt={testimonials[idx].name}
                    className="h-14 w-14 rounded-full border-2 border-gray-200"
                  />
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{testimonials[idx].name}</div>
                    <div className="text-gray-600 font-medium">{testimonials[idx].role}</div>
                  </div>
                </div>
              </TiltCard>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Sparkles, title: "Fast UX", desc: "Sign in under 10s.", color: "from-purple-500 to-pink-500" },
                  { icon: Shield, title: "Private", desc: "Data stays protected.", color: "from-emerald-500 to-teal-500" },
                  { icon: CheckCircle2, title: "Trusted", desc: "5.0 community rating.", color: "from-blue-500 to-indigo-500" },
                ].map((f, i) => (
                  <TiltCard
                    key={i}
                    className="bg-white/95 backdrop-blur-sm border border-gray-200/50 p-6 shadow-xl rounded-xl hover:shadow-2xl transition-all duration-200"
                  >
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} text-white grid place-items-center shadow-lg mb-4`}
                    >
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div className="font-bold text-gray-900 text-lg mb-2">{f.title}</div>
                    <div className="text-gray-600 font-medium">{f.desc}</div>
                  </TiltCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Spotlight>
    </div>
  )
}
