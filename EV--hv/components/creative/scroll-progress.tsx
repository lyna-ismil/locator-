"use client"

import { useEffect, useState } from "react"

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement
      const scrolled = h.scrollTop
      const height = h.scrollHeight - h.clientHeight
      const pct = height > 0 ? (scrolled / height) * 100 : 0
      setProgress(pct)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-lime-500 via-emerald-500 to-amber-500 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
