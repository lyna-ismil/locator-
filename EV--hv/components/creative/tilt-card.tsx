"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"

type TiltCardProps = {
  className?: string
  children?: React.ReactNode
  hoverGlow?: boolean
}

export default function TiltCard({ className, children, hoverGlow = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    // Only update glow position, do NOT change transform
    if (hoverGlow) {
      el.style.setProperty("--gx", `${px * 100}%`)
      el.style.setProperty("--gy", `${py * 100}%`)
    }
  }

  function onMouseLeave() {
    // No transform reset needed, but you can reset glow if you want
    // Optionally: ref.current?.style.setProperty("--gx", "50%")
    // Optionally: ref.current?.style.setProperty("--gy", "50%")
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        "rounded-2xl",
        hoverGlow &&
          "relative before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200 before:bg-[radial-gradient(600px_at_var(--gx,_50%)_var(--gy,_50%),rgba(132,204,22,.18),transparent_60%)]",
        className
      )}
      style={{ transform: "perspective(900px) rotateX(0) rotateY(0)" }}
    >
      {children}
    </div>
  )
}
