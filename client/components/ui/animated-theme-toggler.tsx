'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
  fromCenter?: boolean
  theme?: "light" | "dark"
  onThemeChange?: (theme: "light" | "dark") => void
}

export function AnimatedThemeToggler({
  duration = 400,
  fromCenter = false,
  theme: controlledTheme,
  onThemeChange,
  className,
  ...props
}: AnimatedThemeTogglerProps) {
  const [internalTheme, setInternalTheme] = useState<"light" | "dark">("light")
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isControlled = controlledTheme !== undefined
  const currentTheme = isControlled ? controlledTheme : internalTheme

  useEffect(() => {
    if (!isControlled) {
      const isDark = document.documentElement.classList.contains("dark")
      setInternalTheme(isDark ? "dark" : "light")

      const observer = new MutationObserver(() => {
        const isDarkNow = document.documentElement.classList.contains("dark")
        setInternalTheme(isDarkNow ? "dark" : "light")
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
      return () => observer.disconnect()
    }
  }, [isControlled])

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = currentTheme === "light" ? "dark" : "light"
    
    // View Transitions Check
    // @ts-ignore - Document.startViewTransition is not widely supported in TS DOM types yet
    if (!document.startViewTransition) {
      // Fallback
      if (!isControlled) {
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
        localStorage.setItem("theme", nextTheme)
        setInternalTheme(nextTheme)
      } else {
        onThemeChange?.(nextTheme)
      }
      return
    }

    const { clientX, clientY } = e
    let x = clientX
    let y = clientY

    if (fromCenter) {
      x = window.innerWidth / 2
      y = window.innerHeight / 2
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }

    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    document.documentElement.setAttribute("data-magicui-theme-vt", "active")
    document.documentElement.style.setProperty("--magicui-theme-toggle-vt-duration", `${duration}ms`)

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      if (!isControlled) {
        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
        localStorage.setItem("theme", nextTheme)
        setInternalTheme(nextTheme)
      } else {
        onThemeChange?.(nextTheme)
      }
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
          fill: "forwards"
        }
      ).onfinish = () => {
        document.documentElement.removeAttribute("data-magicui-theme-vt")
        document.documentElement.style.removeProperty("--magicui-theme-toggle-vt-duration")
      }
    })
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 hover:opacity-80",
        className
      )}
      aria-label="Toggle theme"
      {...props}
    >
      {props.children ? props.children : (
        <>
          {currentTheme === "dark" ? (
            <Sun size={15} style={{ color: '#fbbf24' }} />
          ) : (
            <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
          )}
          <span className="sr-only">Toggle theme</span>
        </>
      )}
    </button>
  )
}
