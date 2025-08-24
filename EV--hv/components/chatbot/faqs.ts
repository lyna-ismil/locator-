export type FAQ = {
  id: string
  question: string
  answer: string
  tags: string[]
  keywords?: string[]
  actions?: string[]
}

export const FAQS: FAQ[] = [
  {
    id: "services",
    question: "What services does ChargeConnect offer?",
    answer:
      "ChargeConnect helps EV drivers find compatible, available stations with smart matching, live availability, one‑tap start, and time‑to‑range estimates. For station owners, we provide onboarding, utilization analytics, dynamic pricing controls, and tools to improve uptime and reviews.",
    tags: ["drivers", "owners", "overview"],
    keywords: ["services", "features", "platform", "what do you do", "offerings"],
  },
  {
    id: "connectors",
    question: "Which connectors do you support?",
    answer:
      "We support Type 2, CCS, CHAdeMO, and Tesla (where available). Your profile and vehicle preferences ensure we only recommend stations that match your connector.",
    tags: ["drivers", "compatibility"],
    keywords: ["connector", "type 2", "ccs", "chademo", "tesla", "compatibility", "plug"],
  },
  {
    id: "speed",
    question: "How fast can I charge?",
    answer:
      "Charging speed depends on your vehicle and the station. We surface supported speeds like 22 kW, 50 kW, 150 kW, and 250 kW. The app estimates time‑to‑range, so you’ll know how many km you’ll gain by the time you finish your coffee.",
    tags: ["drivers", "speed"],
    keywords: ["fast", "speed", "kw", "22", "50", "150", "250", "time to range", "quick"],
  },
  {
    id: "pricing",
    question: "How is pricing calculated?",
    answer:
      "Pricing is typically per kWh and varies by station and time of day. We show transparent pricing and any session fees up front. Some owners use dynamic pricing to reduce queues during peak hours.",
    tags: ["drivers", "owners", "pricing"],
    keywords: ["price", "cost", "kwh", "fees", "dynamic pricing", "per kwh"],
  },
  {
    id: "reservations",
    question: "Can I reserve a charger?",
    answer:
      "Yes. When a station supports reservations, you’ll see a Reserve option. We’ll hold a port for a limited window and notify you if anything changes.",
    tags: ["drivers", "flow"],
    keywords: ["reserve", "booking", "hold", "queue"],
  },
  {
    id: "matching",
    question: "How does smart matching work?",
    answer:
      "We consider your connector, preferred speeds, current battery %, station hours, and live availability. We also factor queue intelligence and suggest greener options when tradeoffs are equal.",
    tags: ["drivers", "ml", "smart match"],
    keywords: ["match", "matching", "algorithm", "availability", "queue", "battery"],
  },
  {
    id: "vehicles",
    question: "Which EVs are supported?",
    answer:
      "Any EV is supported. Add your make/model and connector preferences to your profile and we’ll filter recommendations accordingly.",
    tags: ["drivers", "compatibility"],
    keywords: ["vehicle", "car", "model", "supported", "compatibility", "tesla", "nissan", "bmw", "audi"],
  },
  {
    id: "payments",
    question: "What payment methods can I use?",
    answer:
      "You can pay in‑app using major cards. Some stations also accept local wallets. We tokenize payment info and never store raw details.",
    tags: ["drivers", "payments", "security"],
    keywords: ["payment", "card", "credit", "pay", "wallet"],
  },
  {
    id: "reliability",
    question: "How do you ensure reliability?",
    answer:
      "Each station has a network score from uptime, maintenance signals, and community reviews. We highlight verified reliable stations and warn when issues are detected.",
    tags: ["drivers", "owners", "quality"],
    keywords: ["reliable", "uptime", "reviews", "maintenance", "status"],
    actions: ["check_service_status"]
  },
  {
    id: "owners-benefits",
    question: "Why should station owners join?",
    answer:
      "Owners see higher utilization (often 2–3x), better transparency with analytics, and tools for pricing, availability automation, and maintenance insights.",
    tags: ["owners", "benefits"],
    keywords: ["owner", "utilization", "analytics", "revenue", "tools"],
  },
  {
    id: "owners-onboarding",
    question: "How do I add my station?",
    answer:
      "Sign up as an Owner, add station details (connectors, speed, ports, hours, pricing) and verify location. You can manage everything from the Owner Dashboard.",
    tags: ["owners", "onboarding"],
    keywords: ["add station", "onboard", "register", "owner dashboard"],
  },
  {
    id: "coverage",
    question: "Where is ChargeConnect available?",
    answer:
      "We’re expanding rapidly. You’ll see coverage clusters around urban centers, malls, and highway corridors. The map updates as new partners onboard.",
    tags: ["coverage", "map"],
    keywords: ["where", "available", "coverage", "country", "city", "area"],
    actions: ["find_stations_near_me"]
  },
  {
    id: "api",
    question: "Do you have an API?",
    answer:
      "Yes, we offer API access for select partners to surface availability and manage stations. Contact us to request access.",
    tags: ["developers", "owners", "api"],
    keywords: ["api", "integration", "developer", "docs"],
  },
  {
    id: "security",
    question: "Is my data secure?",
    answer:
      "Yes. We use encryption in transit and at rest, and practice strict data minimization. Sensitive fields are tokenized and never stored in raw form.",
    tags: ["security", "privacy"],
    keywords: ["secure", "security", "privacy", "encrypt", "tokenize"],
  },
]