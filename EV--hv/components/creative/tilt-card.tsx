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
    const rx = (py - 0.5) * 10 // rotateX
    const ry = (px - 0.5) * -12 // rotateY
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`
    if (hoverGlow) {
      el.style.setProperty("--gx", `${px * 100}%`)
      el.style.setProperty("--gy", `${py * 100}%`)
    }
  }

  function onMouseLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)"
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        "transition-transform duration-200 will-change-transform rounded-2xl",
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
