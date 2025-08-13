"use client"

import { useEffect, useMemo, useState } from "react"
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
import { apiFetch } from '@/lib/api';
import { FaGoogle, FaFacebook } from "react-icons/fa";

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
  const router = useRouter();
  const searchParams = useSearchParams()
  const defaultType = (searchParams.get("type") as "driver" | "owner") || "driver"
  const [userType, setUserType] = useState<"driver" | "owner">(defaultType)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const score = passwordScore(password)
  const scoreColor = score < 40 ? "bg-red-500" : score < 70 ? "bg-amber-500" : "bg-emerald-600"

  const [testimonials, setTestimonials] = useState<
    { quote: string; name: string; role: string; avatar: string }[]
  >([
    {
      quote: "Loading reviews...",
      name: "",
      role: "",
      avatar: "/placeholder.svg?height=64&width=64",
    },
  ]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const reviews = await apiFetch("/reviews");
        setTestimonials(
          reviews.map((r: any) => ({
            quote: r.text || r.quote || "No review text",
            name: r.name || r.user || "Anonymous",
            role: r.role || "EV User",
            avatar: r.avatar || "/placeholder.svg?height=64&width=64",
          }))
        );
      } catch (err) {
        setTestimonials([
          {
            quote: "Failed to load reviews.",
            name: "",
            role: "",
            avatar: "/placeholder.svg?height=64&width=64",
          },
        ]);
      }
    }
    fetchReviews();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 4200);
    return () => clearInterval(t);
  }, [testimonials.length])

  const [driverForm, setDriverForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    carMake: "",
    carModel: "",
    batteryCapacity: "",
    connectorType: "",
  });
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
    },
    network: "",
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (userType === "driver") {
        await apiFetch("/car-owners", {
          method: "POST",
          body: JSON.stringify(driverForm),
        });
        setSuccess("Car owner account created!");
        router.push("/sign-in");
      } else {
        const res = await apiFetch("/stations", {
          method: "POST",
          body: JSON.stringify({
            ...ownerForm,
            location: {
              type: "Point",
              coordinates: [
                Number(ownerForm.location.coordinates[0]), // lng
                Number(ownerForm.location.coordinates[1]), // lat
              ],
            },
            // Add this line if your schema requires ownerId (for future stations)
            // ownerId: res._id, // Not needed for the first station, but needed for future ones
          }),
        });
        if (res && res._id) {
          localStorage.setItem("ownerId", res._id);
        }
        setSuccess("Station owner account created!");
        router.push("/sign-in");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-10 h-80 w-80 rounded-full bg-lime-200 blur-3xl opacity-70" />
        <div className="absolute top-40 -right-10 h-96 w-96 rounded-full bg-emerald-200 blur-3xl opacity-70" />
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

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left: Voices + benefits */}
            <div className="flex flex-col">
              <div className="mb-4">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">People love the onboarding</Badge>
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
                  { icon: Sparkles, title: "2-min setup", desc: "We guide the essentials." },
                  { icon: Battery, title: "Smart defaults", desc: "Pre-filled for your EV." },
                  { icon: ShieldCheck, title: "Privacy-first", desc: "Data stays safe." },
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

            {/* Right: Form */}
            <TiltCard className="bg-white/90 border border-gray-100 shadow-xl">
              <Card className="border-none shadow-none">
                <CardHeader className="pb-2">
                  <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs w-fit">
                    <Sparkles className="h-3.5 w-3.5" />
                    Personalized matching
                  </div>
                  <CardTitle className="text-2xl md:text-3xl mt-3">Create your account</CardTitle>
                  <CardDescription>Join the smart EV charging network</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Tabs value={userType} onValueChange={(v) => setUserType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="driver" className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        EV Driver
                      </TabsTrigger>
                      <TabsTrigger value="owner" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Station Owner
                      </TabsTrigger>
                    </TabsList>

                    {/* Driver */}
                    <TabsContent value="driver" className="space-y-6 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={driverForm.firstName}
                            onChange={e => setDriverForm({ ...driverForm, firstName: e.target.value })}
                            placeholder="John"
                            className="bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
                            className="bg-white"
                            value={driverForm.lastName}
                            onChange={(e) => setDriverForm({ ...driverForm, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            className="pl-9 bg-white"
                            value={driverForm.email}
                            onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
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
                            placeholder="Strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-9 pr-10 bg-white"
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
                        {/* Strength meter */}
                        <div className="mt-2">
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${scoreColor} transition-all duration-300`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {score < 40 ? "Weak" : score < 70 ? "Okay" : "Strong"} password
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold text-lg mb-4">Vehicle Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="carMake">Car Make</Label>
                            <Select
                              value={driverForm.carMake}
                              onValueChange={(v) => setDriverForm({ ...driverForm, carMake: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select make" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tesla">Tesla</SelectItem>
                                <SelectItem value="nissan">Nissan</SelectItem>
                                <SelectItem value="bmw">BMW</SelectItem>
                                <SelectItem value="audi">Audi</SelectItem>
                                <SelectItem value="volkswagen">Volkswagen</SelectItem>
                                <SelectItem value="hyundai">Hyundai</SelectItem>
                                <SelectItem value="kia">Kia</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carModel">Car Model</Label>
                            <Input
                              id="carModel"
                              placeholder="Model 3, Leaf, i3..."
                              className="bg-white"
                              value={driverForm.carModel}
                              onChange={(e) => setDriverForm({ ...driverForm, carModel: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="batteryCapacity">Battery Capacity (kWh)</Label>
                            <Input
                              id="batteryCapacity"
                              type="number"
                              placeholder="75"
                              className="bg-white"
                              value={driverForm.batteryCapacity}
                              onChange={(e) => setDriverForm({ ...driverForm, batteryCapacity: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="connectorType">Preferred Connector</Label>
                            <Select
                              value={driverForm.connectorType}
                              onValueChange={(v) => setDriverForm({ ...driverForm, connectorType: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select connector" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="type2">Type 2</SelectItem>
                                <SelectItem value="ccs">CCS</SelectItem>
                                <SelectItem value="chademo">CHAdeMO</SelectItem>
                                <SelectItem value="tesla">Tesla Supercharger</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        I agree to the{" "}
                        <Link href="#" className="text-emerald-700 hover:underline">
                          Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="#" className="text-emerald-700 hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </label>

                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                        type="submit"
                        onClick={handleSubmit}
                      >
                        Create Account
                      </Button>
                      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                      {success && <div className="text-green-600 text-sm mt-2">{success}</div>}

                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-11 bg-transparent">
                          <FaGoogle size={16} color="#EA4335" style={{ marginRight: "0.5rem" }} />
                          Google
                        </Button>
                        <Button variant="outline" className="h-11 bg-transparent">
                          <FaFacebook size={16} color="#1877F3" style={{ marginRight: "0.5rem" }} />
                          Facebook
                        </Button>
                      </div>

                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        You can update details later in your profile.
                      </p>

                      <div className="text-center text-sm text-gray-600 pt-2">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-emerald-700 hover:underline">
                          Sign in
                        </Link>
                      </div>
                    </TabsContent>

                    {/* Owner */}
                    <TabsContent value="owner" className="space-y-6 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ownerFirstName">First Name</Label>
                          <Input
                            id="ownerFirstName"
                            placeholder="Jane"
                            className="bg-white"
                            value={ownerForm.firstName}
                            onChange={(e) => setOwnerForm({ ...ownerForm, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ownerLastName">Last Name</Label>
                          <Input
                            id="ownerLastName"
                            placeholder="Smith"
                            className="bg-white"
                            value={ownerForm.lastName}
                            onChange={(e) => setOwnerForm({ ...ownerForm, lastName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ownerEmail">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="ownerEmail"
                            type="email"
                            placeholder="jane@example.com"
                            className="pl-9 bg-white"
                            value={ownerForm.email}
                            onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ownerPassword">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="ownerPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Strong password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value)
                              setOwnerForm({ ...ownerForm, password: e.target.value }) // <-- add this line
                            }}
                            className="pl-9 pr-10 bg-white"
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
                        {/* Strength meter */}
                        <div className="mt-2">
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${scoreColor} transition-all duration-300`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {score < 40 ? "Weak" : score < 70 ? "Okay" : "Strong"} password
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold text-lg mb-4">Business Information</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                              id="businessName"
                              value={ownerForm.businessName}
                              onChange={e => setOwnerForm({ ...ownerForm, businessName: e.target.value })}
                              placeholder="Green Energy Solutions"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessType">Business Type</Label>
                            <Select
                              value={ownerForm.businessType}
                              onValueChange={(v) => setOwnerForm({ ...ownerForm, businessType: v })}
                            >
                              <SelectTrigger>
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
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              className="bg-white"
                              value={ownerForm.phone}
                              onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stationName">Station Name</Label>
                            <Input
                              id="stationName"
                              value={ownerForm.stationName}
                              onChange={e => setOwnerForm({ ...ownerForm, stationName: e.target.value })}
                              placeholder="Main Street Station"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="locationAddress">Location Address</Label>
                            <Input
                              id="locationAddress"
                              value={ownerForm.location.address}
                              onChange={e =>
                                setOwnerForm({
                                  ...ownerForm,
                                  location: { ...ownerForm.location, address: e.target.value },
                                })
                              }
                              placeholder="123 Main St"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="locationCity">City</Label>
                            <Input
                              id="locationCity"
                              value={ownerForm.location.city}
                              onChange={e =>
                                setOwnerForm({
                                  ...ownerForm,
                                  location: { ...ownerForm.location, city: e.target.value },
                                })
                              }
                              placeholder="New York"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="locationLat">Latitude</Label>
                            <Input
                              id="locationLat"
                              value={ownerForm.location.coordinates[1]}
                              onChange={e =>
                                setOwnerForm({
                                  ...ownerForm,
                                  location: {
                                    ...ownerForm.location,
                                    coordinates: [ownerForm.location.coordinates[0], e.target.value],
                                  },
                                })
                              }
                              placeholder="Latitude"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="locationLng">Longitude</Label>
                            <Input
                              id="locationLng"
                              value={ownerForm.location.coordinates[0]}
                              onChange={e =>
                                setOwnerForm({
                                  ...ownerForm,
                                  location: {
                                    ...ownerForm.location,
                                    coordinates: [e.target.value, ownerForm.location.coordinates[1]],
                                  },
                                })
                              }
                              placeholder="Longitude"
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="network">Network</Label>
                            <Input
                              id="network"
                              value={ownerForm.network}
                              onChange={e => setOwnerForm({ ...ownerForm, network: e.target.value })}
                              placeholder="ChargePoint, Tesla, etc."
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="locationType">Location Type</Label>
                            <Select
                              value={ownerForm.location.type}
                              onValueChange={v =>
                                setOwnerForm({
                                  ...ownerForm,
                                  location: { ...ownerForm.location, type: v },
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PUBLIC">Public</SelectItem>
                                <SelectItem value="PRIVATE">Private</SelectItem>
                                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        I agree to the{" "}
                        <Link href="#" className="text-emerald-700 hover:underline">
                          Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="#" className="text-emerald-700 hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </label>

                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                        type="submit"
                        onClick={handleSubmit}
                      >
                        Create Account
                      </Button>
                      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                      {success && <div className="text-green-600 text-sm mt-2">{success}</div>}

                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-11 bg-transparent">
                          <FaGoogle className="h-4 w-4 mr-2 text-[#EA4335]" />
                          Google
                        </Button>
                        <Button variant="outline" className="h-11 bg-transparent">
                          <FaFacebook style={{ height: "1rem", width: "1rem", marginRight: "0.5rem", color: "#1877F3" }} />
                          Facebook
                        </Button>
                      </div>

                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        You can add stations later in your dashboard.
                      </p>

                      <div className="text-center text-sm text-gray-600 pt-2">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-emerald-700 hover:underline">
                          Sign in
                        </Link>
                      </div>
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
