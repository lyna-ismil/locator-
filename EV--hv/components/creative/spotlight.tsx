"use client"

import { useRef } from "react"

type SpotlightProps = {
  className?: string
  intensity?: number // 0.2-1
  color?: string // e.g. "rgba(16,185,129,0.25)"
  children?: React.ReactNode
}

export default function Spotlight({
  className = "",
  intensity = 0.6,
  color = "rgba(16,185,129,0.28)",
  children,
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty("--sx", `${x}px`)
    el.style.setProperty("--sy", `${y}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`relative ${className}`}
      style={
        {
          "--sx": "50%",
          "--sy": "50%",
          "--intensity": intensity,
          "--sc": color,
        } as React.CSSProperties
      }
    >
      {/* Spotlight layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(200px_200px_at_var(--sx)_var(--sy),#000_10%,transparent_60%)]"
        style={{
          background: `radial-gradient(480px 480px at var(--sx) var(--sy), var(--sc) 0%, transparent 60%)`,
          opacity: "var(--intensity)",
        }}
      />
      {children}
    </div>
  )
}
