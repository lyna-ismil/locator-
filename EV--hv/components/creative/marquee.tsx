"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

type MarqueeProps = {
  items: React.ReactNode[]
  className?: string
  speed?: "slow" | "normal" | "fast"
  reverse?: boolean
}

export default function Marquee({ items, className, speed = "normal", reverse = false }: MarqueeProps) {
  const duration = useMemo(() => {
    if (speed === "slow") return "40s"
    if (speed === "fast") return "14s"
    return "22s"
  }, [speed])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="flex min-w-full gap-12 will-change-transform"
        style={{
          animation: `${reverse ? "marquee-rev" : "marquee"} ${duration} linear infinite`,
        }}
      >
        {[...items, ...items].map((it, i) => (
          <div key={i} className="shrink-0 opacity-80 hover:opacity-100 transition-opacity">
            {it}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-rev {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  )
}
