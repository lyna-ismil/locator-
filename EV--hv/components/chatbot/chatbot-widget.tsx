"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { FAQS } from "./faqs"
import { buildIndex, topMatches } from "./search"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MessageCircleQuestion, Send, Zap, X, Sparkles, PlugZap } from 'lucide-react'

type Msg = {
  id: string
  role: "user" | "assistant"
  content: string
  suggested?: string[]
}

const SUGGESTIONS = [
  "Which connectors do you support?",
  "How fast can I charge?",
  "How do reservations work?",
  "What’s the pricing?",
  "Why should owners join?",
]

const STORAGE_KEY = "cc_chat_history_v1"

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Msg[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const index = useMemo(() => buildIndex(FAQS), [])
  const faqById = useMemo(() => {
    const m = new Map(FAQS.map((f) => [f.id, f]))
    return m
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setMessages(JSON.parse(raw))
      } else {
        // Seed welcome
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi! I’m the ChargeConnect Assistant. Ask me anything about connectors, pricing, reservations, or station ownership.",
            suggested: SUGGESTIONS,
          },
        ])
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  function ask(query: string) {
    const q = query.trim()
    if (!q) return
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: q },
    ])
    setInput("")

    // simulate small delay
    setTimeout(() => {
      const matches = topMatches(q, index, 3, 1)
      if (matches.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I’m not fully sure, but here are popular topics I can help with:\n• Connectors and compatibility\n• Charging speeds and time‑to‑range\n• Pricing and reservations\n• Owner onboarding and analytics",
            suggested: SUGGESTIONS,
          },
        ])
        return
      }

      const best = faqById.get(matches[0].id)
      const followUps =
        matches
          .slice(1)
          .map((m) => faqById.get(m.id)?.question)
          .filter(Boolean) as string[]

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: best?.answer || "Here’s what I found.",
          suggested: followUps.length ? followUps : SUGGESTIONS,
        },
      ])
    }, 220)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    ask(input)
  }

  function handleSuggestion(s: string) {
    ask(s)
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setOpen(true)}
            className="h-12 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            aria-label="Open ChargeConnect Assistant"
          >
            <MessageCircleQuestion className="h-5 w-5 text-white" />
            <span className="ml-2 hidden sm:inline text-white">Ask us</span>
          </Button>
        </div>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))]">
          <Card className="shadow-2xl border-emerald-100 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="leading-none">ChargeConnect Assistant</CardTitle>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Instant answers about charging & services
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Beta</Badge>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Messages */}
              <div
                ref={containerRef}
                className="max-h-[50vh] overflow-y-auto pr-1 pb-3 space-y-3"
                role="log"
                aria-live="polite"
              >
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm shadow-sm max-w-[85%] whitespace-pre-wrap",
                        m.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                      )}
                    >
                      {m.role !== "user" && (
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-emerald-700">
                          <PlugZap className="h-3.5 w-3.5" />
                          ChargeConnect
                        </div>
                      )}
                      <div>{m.content}</div>
                      {m.suggested && m.suggested.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.suggested.slice(0, 4).map((s) => (
                            <button
                              key={s}
                              className="text-xs px-2 py-1 rounded-full border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                              onClick={() => handleSuggestion(s)}
                              aria-label={`Ask: ${s}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about connectors, pricing, reservations..."
                  aria-label="Chat message"
                  className="bg-white"
                />
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* Quick suggestions when empty */}
              {messages.length <= 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="text-xs px-2 py-1 rounded-full border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                      onClick={() => handleSuggestion(s)}
                      aria-label={`Ask: ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
