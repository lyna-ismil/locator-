"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const [testimonials, setTestimonials] = useState<
    { quote: string; name: string; role: string; avatar: string }[]
  >([
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
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 4000)
    return () => clearInterval(t)
  }, [testimonials.length])

  // Reset error/success on input change
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.id]: e.target.value })
    setError("")
    setSuccess("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      // Try station owner login first
      const res = await apiFetch("/stations/signin", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      if (res.owner && res.owner._id) {
        localStorage.setItem("ownerId", res.owner._id)
        setSuccess("Signed in as station owner!")
        router.push("/dashboard/owner")
      } else {
        setError("Login failed: owner ID not found.")
      }
    } catch (stationErr: any) {
      try {
        // If station login fails, try car owner (driver) login
        await apiFetch("/car-owners/signin", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        })
        setSuccess("Signed in as driver!")
        router.push("/dashboard/driver")
      } catch (driverErr: any) {
        setError("Invalid email or password.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-16 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-70" />
        <div className="absolute top-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-emerald-200 blur-3xl opacity-70" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full bg-amber-100 blur-3xl opacity-70" />
      </div>

      <Spotlight className="relative">
        <div className="container mx-auto px-4 md:px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center shadow-sm">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">ChargeConnect</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Smart EV Network</div>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" className="text-gray-700 hover:text-emerald-700">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-2 gap-10 items-stretch">
            {/* Form Card */}
            <TiltCard className="bg-white/90 border border-gray-100 shadow-xl">
              <Card className="border-none shadow-none">
                <CardHeader className="pb-2">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs w-fit">
                    <Shield className="h-3.5 w-3.5" />
                    Secure sign in
                  </div>
                  <CardTitle className="text-2xl md:text-3xl mt-3">Welcome back</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-9 bg-white"
                          value={form.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-10 bg-white"
                          value={form.password}
                          onChange={handleInputChange}
                          required
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-gray-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Remember me
                      </label>
                      <Link href="/forgot-password" className="text-emerald-700 hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                      disabled={success !== "" || loading}
                    >
                      {loading ? "Signing In..." : success ? "Redirecting..." : "Sign In"}
                    </Button>
                    {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                    {success && <div className="text-green-600 text-sm mt-2">{success}</div>}

                    <div className="flex items-center gap-3 my-2">
                      <span className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs text-gray-500">or continue with</span>
                      <span className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-11 bg-transparent">
                        <span className="mr-2">
                          <FaGoogle size="1rem" />
                        </span>
                        Google
                      </Button>
                      <Button variant="outline" className="h-11 bg-transparent">
                        <span className="mr-2"><FaFacebook size="1rem" /></span>
                        Facebook
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Encrypted and protected — we never share your data.
                    </p>

                    <div className="text-center text-sm text-gray-600 pt-2">
                      Don{"'"}t have an account?{" "}
                      <Link href="/sign-up" className="text-emerald-700 hover:underline">
                        Create one
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TiltCard>

            {/* Voices/Benefits Panel */}
            <div className="flex flex-col">
              <div className="mb-4">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">What people say</Badge>
              </div>

              <TiltCard className="bg-white border border-gray-100 p-8 shadow-xl mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-2xl font-semibold leading-snug">“{testimonials[idx].quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={testimonials[idx].avatar || "/placeholder.svg"}
                    alt={testimonials[idx].name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">{testimonials[idx].name}</div>
                    <div className="text-sm text-gray-600">{testimonials[idx].role}</div>
                  </div>
                </div>
              </TiltCard>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Sparkles, title: "Fast UX", desc: "Sign in under 10s." },
                  { icon: Shield, title: "Private", desc: "Data stays protected." },
                  { icon: CheckCircle2, title: "Trusted", desc: "5.0 community rating." },
                ].map((f, i) => (
                  <TiltCard key={i} className="bg-white border border-gray-100 p-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white grid place-items-center">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-3 font-semibold">{f.title}</div>
                    <div className="text-sm text-gray-600">{f.desc}</div>
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
