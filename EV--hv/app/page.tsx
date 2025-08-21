"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  MapPin,
  Clock,
  Shield,
  Smartphone,
  Battery,
  Car,
  Sparkles,
  ChevronRight,
  LocateFixed,
  Leaf,
  Gauge,
  Star,
} from "lucide-react"
import TiltCard from "@/components/creative/tilt-card"
import Marquee from "@/components/creative/marquee"
import ScrollProgress from "@/components/creative/scroll-progress"
import ChatbotWidget from "@/components/chatbot/chatbot-widget"
import MapTunisia from "@/components/map/tunisia-map"
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa"
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  // Testimonials carousel (dynamic from backend)
  const [testimonials, setTestimonials] = useState<
    { quote: string; name: string; role: string; avatar: string }[]
  >([
    {
      quote: "Loading reviews...",
      name: "",
      role: "",
      avatar: "/placeholder.svg?height=68&width=68",
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
            avatar: r.avatar || "/placeholder.svg?height=68&width=68",
          })),
        )
      } catch (err) {
        setTestimonials([
          {
            quote: "Failed to load reviews.",
            name: "",
            role: "",
            avatar: "/placeholder.svg?height=68&width=68",
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

  // Live "smart match" demo
  const [demoQuery, setDemoQuery] = useState("Downtown, 30% battery, CCS")
  const smartHints = [
    { icon: MapPin, text: "0.7 km • Open Now • 2/6 free" },
    { icon: Gauge, text: "Fast: 150 kW • Peak ends in 12m" },
    { icon: Battery, text: "Est. +220 km in 25 min" },
  ]

  const logos = [
    "evercharge",
    "chargepoint",
    "volta",
    "electrify",
    "shell-recharge",
    "ionity",
    "evgo",
    "greenlots",
  ].map((name) => (
    <img
      key={name}
      src={`/placeholder.svg?height=40&width=120&query=${encodeURIComponent(name + " logo")}`}
      alt={`${name} logo`}
      className="h-10 w-auto opacity-70"
    />
  ))

  const [ownerForm, setOwnerForm] = useState({
    stationName: "",
    network: "",
    email: "",
    password: "",
    ownerId: "", // will set to email for now
    location: {
      type: "Point",
      coordinates: ["", ""], // [longitude, latitude]
    },
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  async function handleOwnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (
      !ownerForm.stationName ||
      !ownerForm.network ||
      !ownerForm.email ||
      !ownerForm.password ||
      !ownerForm.location.coordinates[0] ||
      !ownerForm.location.coordinates[1] ||
      !ownerForm.address.street ||
      !ownerForm.address.city ||
      !ownerForm.address.state ||
      !ownerForm.address.zipCode
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Ensure at least one connector (backend requires it)
    const defaultConnector = {
      type: "TYPE2",
      chargerLevel: "AC Level 2",
      powerKW: 22,
      status: "Available",
    }

    const connectors = Array.isArray((ownerForm as any).connectors) && (ownerForm as any).connectors.length
      ? (ownerForm as any).connectors
      : [defaultConnector]

    const payload = {
      ...ownerForm,
      ownerId: ownerForm.email,
      location: {
        ...ownerForm.location,
        coordinates: [
          Number(ownerForm.location.coordinates[0]),
          Number(ownerForm.location.coordinates[1])
        ]
      },
      connectors, // <-- added
    };

    try {
      await apiFetch("/stations/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess("Station owner account created!");
      router.push("/sign-in");
    } catch (err) {
      setError("Failed to create account. Please check your input and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ScrollProgress />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center shadow-sm">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">ChargeConnect</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Smart EV Network</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#hero" className="hover:text-emerald-600 transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">
              Features
            </a>
            <a href="#map" className="hover:text-emerald-600 transition-colors">
              Map
            </a>
            <a href="#gallery" className="hover:text-emerald-600 transition-colors">
              Gallery
            </a>
            <a href="#flow" className="hover:text-emerald-600 transition-colors">
              How it works
            </a>
            <a href="#voices" className="hover:text-emerald-600 transition-colors">
              Voices
            </a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-gray-600 hover:text-emerald-700">
              Sign in
            </Link>
            <Link href="/sign-up">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/ev-charging-hero.webp')",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-6">
                <Zap className="w-4 h-4 mr-2 text-lime-400" />
                <span className="text-sm font-medium">Smart EV Charging Platform</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                The most intuitive way to{" "}
                <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
                  find your perfect charge
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-200">
                Real-time matching that considers your connector, speed, hours, and current battery — then guides you
                with live availability and time-to-range.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/sign-up?type=driver">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Car className="h-4 w-4 mr-2" />
                  I&apos;m a driver
                </Button>
              </Link>
              <Link href="/sign-up?type=owner">
                <Button
                  variant="outline"
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                >
                  <Zap className="h-4 w-4 mr-2" />I own stations
                </Button>
              </Link>
            </div>

            {/* Partner logos */}
            <div className="mt-10">
              <Marquee items={logos} speed="slow" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE MOSAIC */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <Badge className="bg-lime-100 text-lime-800 hover:bg-lime-100">Why it feels effortless</Badge>
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
              Creative UX that removes friction
            </h2>
            <p className="mt-4 text-gray-600 text-lg">
              Every interaction is designed to be obvious, fast, and satisfying — no manuals needed.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: LocateFixed,
                title: "Context-aware search",
                desc: "Understands locations, battery %, connectors, and speed preferences in one line.",
                accent: "from-lime-500 to-emerald-600",
              },
              {
                icon: Battery,
                title: "Time-to-range",
                desc: "See how much real range you&apos;ll gain by the time you finish your coffee.",
                accent: "from-amber-500 to-lime-600",
              },
              {
                icon: Shield,
                title: "Verified reliability",
                desc: "Network score blends uptime + reviews so you never gamble on a stop.",
                accent: "from-emerald-600 to-emerald-800",
              },
              {
                icon: Smartphone,
                title: "One-tap start",
                desc: "Arrive, tap, charge. No QR hunts. No guesswork.",
                accent: "from-lime-600 to-amber-500",
              },
              {
                icon: Clock,
                title: "Queue intelligence",
                desc: "We&apos;ll suggest a nearby faster match if a queue starts forming.",
                accent: "from-amber-600 to-emerald-600",
              },
              {
                icon: Leaf,
                title: "Greener choices",
                desc: "Prefer stations powered by renewables when options are equal.",
                accent: "from-emerald-500 to-lime-500",
              },
            ].map((f, i) => (
              <TiltCard key={i} className="group bg-white border border-gray-100 p-6 shadow-sm">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.accent} text-white grid place-items-center shadow`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-gray-600">{f.desc}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-emerald-700">
                  Learn more
                  <ChevronRight className="h-4 w-4" />
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* MAP OF TUNISIA */}
      <section id="map" className="py-20 md:py-28 bg-emerald-50/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <Badge className="bg-emerald-600 hover:bg-emerald-700">Live Map</Badge>
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">Find chargers across Tunisia</h2>
            <p className="mt-4 text-gray-700">
              Filter by connector and speed, then tap a station to see availability and navigate.
            </p>
          </div>
          <div className="mt-8">
            <MapTunisia height={520} />
          </div>
        </div>
      </section>

      {/* GALLERY SECTION (kept) */}
      <section id="gallery" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <Badge className="bg-emerald-600 hover:bg-emerald-700">Gallery</Badge>
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">Electric life in pictures</h2>
            <p className="mt-4 text-gray-700">
              From plugs to plazas — a visual look at connectors, stations, and EV moments.
            </p>
          </div>

          {/* Charger Types */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-900">Charger types we support</h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Type 2",
                  alt: "Type 2 AC charging connector",
                  src: "/images/connectors/type2-connector.png",
                },
                {
                  label: "CCS",
                  alt: "CCS DC fast charging connector",
                  src: "/images/connectors/ccs-connector.png",
                },
                {
                  label: "CHAdeMO",
                  alt: "CHAdeMO DC fast charging connector",
                  src: "/images/connectors/chademo-connector.png",
                },
                {
                  label: "CCS Combo",
                  alt: "CCS Combo charging connector",
                  src: "/images/connectors/ccs-combo-connector.png",
                },
              ].map((c, i) => (
                <TiltCard key={i} className="overflow-hidden group">
                  <div className="relative h-40 md:h-48 rounded-2xl overflow-hidden">
                    <img
                      src={c.src || "/placeholder.svg"}
                      alt={c.alt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-white/90 text-gray-900 hover:bg-white">{c.label}</Badge>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>

          {/* EV Photo Mosaic */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900">In the wild</h3>
            <p className="mt-2 text-gray-600">
              Real charging moments from the community — city streets, highway stops, malls, and at-home setups.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["City", "Highway", "Mall", "Home", "Owners"].map((label) => (
                <a
                  key={label}
                  href={label === "City" ? "#map" : "#gallery"}
                  className="text-xs px-3 py-1 rounded-full border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                  aria-label={`Browse ${label.toLowerCase()} photos`}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Wide lead image */}
              <TiltCard className="col-span-2 md:col-span-3 overflow-hidden group">
                <div className="relative h-48 md:h-72 rounded-2xl overflow-hidden">
                  <img
                    src="/placeholder.svg?height=480&width=1200"
                    alt="EV at a modern charging station in a city setting"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              </TiltCard>

              {/* Smaller tiles */}
              {[
                {
                  alt: "Driver plugging cable into EV at a public charger",
                  query: "driver plugging ev charging cable at public charger",
                },
                {
                  alt: "EV charging station at mall plaza during sunset",
                  query: "ev charging station mall plaza sunset warm light",
                },
                {
                  alt: "Dashboard app view showing live availability and pricing",
                  query: "mobile app ui ev charging live availability pricing dashboard",
                },
                {
                  alt: "Highway fast charging stop with multiple stalls",
                  query: "highway fast charging station multiple stalls 150 kw",
                },
                {
                  alt: "Close shot of charging cable and port connected",
                  query: "close shot ev charging cable connected to car port",
                },
                {
                  alt: "Owner checking utilization analytics on a tablet",
                  query: "station owner analytics dashboard on tablet utilization",
                },
              ].map((img, i) => (
                <TiltCard key={i} className="overflow-hidden group">
                  <div className="relative h-36 md:h-56 rounded-2xl overflow-hidden">
                    <img
                      src={`/placeholder.svg?height=420&width=640&query=${encodeURIComponent(img.query)}`}
                      alt={img.alt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FLOW TIMELINE */}
      <section id="flow" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-3 gap-10">
            <div>
              <Badge className="bg-emerald-600 hover:bg-emerald-700">How it works</Badge>
              <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
                From thought to charge in minutes
              </h2>
              <p className="mt-4 text-gray-700">
                A curved, three-step journey crafted to reduce decisions and move you forward.
              </p>
            </div>
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="absolute left-4 md:left-6 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-emerald-600 via-lime-500 to-amber-500" />
                <div className="space-y-10 pl-14 md:pl-20">
                  {[
                    {
                      title: "Tell us your intent",
                      desc: "Type a location, battery %, and connector. We infer the rest.",
                      icon: Sparkles,
                    },
                    {
                      title: "We match in real time",
                      desc: "Connector, speed, hours, and live availability all aligned to your needs.",
                      icon: MapPin,
                    },
                    {
                      title: "Navigate & one-tap start",
                      desc: "We guide you in-app and begin charging with a single tap.",
                      icon: Car,
                    },
                  ].map((step, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-3.5 md:-left-1 top-0">
                        <div className="h-8 w-8 rounded-full bg-white border-2 border-emerald-600 grid place-items-center shadow-sm">
                          <step.icon className="h-4 w-4 text-emerald-700" />
                        </div>
                      </div>
                      <Card className="border-emerald-100">
                        <CardHeader>
                          <CardTitle className="text-xl">{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-600">{step.desc}</CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA Bar */}
          <div className="mt-12 md:mt-16">
            <Card className="bg-gradient-to-r from-emerald-600 to-lime-600 text-white border-none">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold">Ready to power your next trip?</h3>
                  <p className="text-emerald-50/90">
                    Join drivers and station owners creating a smarter charging network.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href="/sign-up?type=driver">
                    <Button variant="secondary" className="text-gray-900">
                      I&apos;m a driver
                    </Button>
                  </Link>
                  <Link href="/sign-up?type=owner">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                      I own stations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="voices" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">What people say</Badge>
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">Loved by drivers and owners</h2>
            <p className="mt-4 text-gray-600">Proof that thoughtful UX and real-time data can change daily habits.</p>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-6">
            {/* Main rotating card */}
            <TiltCard className="lg:col-span-2 bg-white border border-gray-100 p-8 shadow-xl">
              <Star className="h-6 w-6 text-amber-500" />
              <p className="mt-4 text-2xl md:text-3xl font-semibold leading-snug">“{testimonials[idx].quote}”</p>
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

            {/* Side list */}
            <div className="space-y-4">
              {testimonials.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-full text-left rounded-2xl border p-5 transition-colors ${
                    idx === i ? "border-emerald-300 bg-emerald-50" : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={t.avatar || "/placeholder.svg"} alt={t.name} className="h-10 w-10 rounded-full" />
                    <div className="font-medium">{t.name}</div>
                  </div>
                  <p className="mt-2 text-gray-600 line-clamp-2">“{t.quote}”</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white">
        <div className="container mx-auto px-4 md:px-6 py-16">
          {/* Newsletter Section */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Stay charged with updates</h3>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Get the latest on new stations, features, and EV charging insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button className="bg-emerald-600 hover:bg-emerald-700 px-6">Subscribe</Button>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center shadow-lg">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">ChargeConnect</div>
                  <div className="text-xs uppercase tracking-wider text-emerald-400">Smart EV Network</div>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-sm">
                A creative, human-first experience for finding the right charge — faster, greener, and with zero
                guesswork. Join thousands of drivers and station owners building the future of EV charging.
              </p>

              {/* Social Links */}
              <div className="flex gap-4">
                {[
                  { name: "Facebook", icon: <FaFacebook size={24} color="white" /> },
                  { name: "Twitter", icon: <FaTwitter size={24} color="white" /> },
                  { name: "LinkedIn", icon: <FaLinkedin size={24} color="white" /> },
                  { name: "Instagram", icon: <FaInstagram size={24} color="white" /> },
                ].map((social) => (
                  <a
                    key={social.name}
                    href="#"
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-emerald-400">Platform</h4>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Find Stations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Add Your Station
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile App
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    API Access
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-emerald-400">Company</h4>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Press Kit
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support & Contact */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-emerald-400">Support</h4>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    System Status
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Community
                  </Link>
                </li>
              </ul>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Get in touch</p>
                <p className="text-sm text-gray-300">hello@chargeconnect.tn</p>
                <p className="text-sm text-gray-300">+216 XX XXX XXX</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                © {new Date().getFullYear()} ChargeConnect. All rights reserved. Made with ⚡ in Tunisia.
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <Link href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link href="#" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
                <Link href="#" className="hover:text-white transition-colors">
                  Accessibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <ChatbotWidget />
    </div>
  )
}
