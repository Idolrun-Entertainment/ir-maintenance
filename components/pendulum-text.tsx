"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { SplitText } from "gsap/SplitText"

import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, SplitText)

type RestPose = {
  x: number
  y: number
  rotation: number
}

function createSignDamage(chars: Element[]) {
  const letters = chars.filter((char) => char.textContent?.trim()) as HTMLElement[]

  if (letters.length === 0) {
    return gsap.timeline()
  }

  const loose = new Set([0, 4, 5, 9, 14, 15])
  const rest: RestPose[] = letters.map((_, i) => {
    const amp = loose.has(i) ? 1.35 : 1
    return {
      x: gsap.utils.random(-2.2, 2.2) * amp,
      y: gsap.utils.random(-2.8, 3.6) * amp,
      rotation: gsap.utils.random(-3.2, 3.8) * amp,
    }
  })

  gsap.set(letters, {
    x: (i) => rest[i].x,
    y: (i) => rest[i].y,
    rotation: (i) => rest[i].rotation,
    skewX: 0,
    transformOrigin: (i) => (loose.has(i) ? "50% 0%" : "50% 80%"),
  })

  const settle = (index: number, vars: gsap.TweenVars = {}): gsap.TweenVars => ({
    x: rest[index].x,
    y: rest[index].y,
    rotation: rest[index].rotation,
    skewX: 0,
    skewY: 0,
    scaleX: 1,
    scaleY: 1,
    ...vars,
  })

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.7 })

  // Loose "T" drops; neighbors sag, then the tile snaps back.
  tl.to(
    letters[9],
    {
      y: rest[9].y + 10,
      rotation: rest[9].rotation + 7,
      duration: 0.38,
      ease: "power2.in",
    },
    0.55
  )
  tl.to(
    letters[8],
    { y: rest[8].y + 3, duration: 0.28, ease: "power1.out" },
    0.72
  )
  tl.to(
    letters[10],
    { y: rest[10].y + 2.5, duration: 0.28, ease: "power1.out" },
    0.78
  )
  tl.to(letters[9], settle(9, { duration: 0.55, ease: "back.out(1.5)" }), 1.05)
  tl.to(letters[8], settle(8, { duration: 0.4, ease: "power2.out" }), 1.18)
  tl.to(letters[10], settle(10, { duration: 0.4, ease: "power2.out" }), 1.22)

  // Brief mechanical rattle across UNDER.
  ;[0, 1, 2, 3, 4].forEach((index, order) => {
    tl.to(
      letters[index],
      {
        x: rest[index].x + gsap.utils.random(-2.8, 2.8),
        y: rest[index].y + gsap.utils.random(-2.2, 2.2),
        duration: 0.06,
        ease: "none",
      },
      2.05 + order * 0.03
    )
    tl.to(
      letters[index],
      settle(index, { duration: 0.28, ease: "power2.out" }),
      2.18 + order * 0.03
    )
  })

  // "R" lags sideways like a loose panel, then catches up.
  tl.to(
    letters[4],
    {
      x: rest[4].x + 6,
      y: rest[4].y + 1.5,
      rotation: rest[4].rotation - 5,
      duration: 0.55,
      ease: "power1.in",
    },
    2.85
  )
  tl.to(letters[4], settle(4, { duration: 0.42, ease: "power3.out" }), 3.5)

  // Short glitch on A-I-N, then restore.
  ;[6, 7, 8].forEach((index, order) => {
    tl.to(
      letters[index],
      {
        skewX: order % 2 === 0 ? 10 : -9,
        x: rest[index].x + (order % 2 === 0 ? 3.5 : -3),
        scaleX: 1.06,
        duration: 0.055,
        ease: "none",
      },
      4.05 + order * 0.04
    )
    tl.to(
      letters[index],
      {
        skewX: order % 2 === 0 ? -6 : 5,
        duration: 0.05,
        ease: "none",
      },
      4.12 + order * 0.04
    )
    tl.to(
      letters[index],
      settle(index, { duration: 0.32, ease: "power2.out" }),
      4.2 + order * 0.04
    )
  })

  // "M" tilts like a hanging board.
  tl.to(
    letters[5],
    {
      rotation: rest[5].rotation + 12,
      y: rest[5].y + 4,
      duration: 0.45,
      ease: "power1.inOut",
    },
    4.95
  )
  tl.to(letters[5], settle(5, { duration: 0.7, ease: "back.out(1.35)" }), 5.5)

  // Last "E" slips down, then seats again.
  tl.to(
    letters[15],
    {
      y: rest[15].y + 8,
      x: rest[15].x - 2,
      rotation: rest[15].rotation + 5,
      duration: 0.32,
      ease: "power2.in",
    },
    6.35
  )
  tl.to(letters[15], settle(15, { duration: 0.5, ease: "back.out(1.4)" }), 6.78)

  // Construction shudder on C and nearby N.
  ;[13, 14].forEach((index, order) => {
    tl.to(
      letters[index],
      {
        x: rest[index].x + (order === 0 ? -2.4 : 2.6),
        y: rest[index].y + 1.8,
        rotation: rest[index].rotation + (order === 0 ? -4 : 3),
        duration: 0.07,
        ease: "none",
      },
      7.4 + order * 0.05
    )
    tl.to(
      letters[index],
      {
        x: rest[index].x + (order === 0 ? 1.8 : -1.6),
        y: rest[index].y - 1.2,
        duration: 0.07,
        ease: "none",
      }
    )
    tl.to(letters[index], settle(index, { duration: 0.34, ease: "power2.out" }))
  })

  // Opening "U" sags, then the whole line settles for a seamless loop.
  tl.to(
    letters[0],
    {
      y: rest[0].y + 6,
      rotation: rest[0].rotation - 6,
      duration: 0.3,
      ease: "power2.in",
    },
    8.05
  )
  tl.to(letters[0], settle(0, { duration: 0.48, ease: "back.out(1.3)" }), 8.42)
  tl.to(
    letters,
    {
      x: (i) => rest[i].x,
      y: (i) => rest[i].y,
      rotation: (i) => rest[i].rotation,
      skewX: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.45,
      ease: "power2.inOut",
    },
    8.85
  )

  return tl
}

export function PendulumText({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const textRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(textRef.current, { transformOrigin: "50% 0%" })
        gsap.fromTo(
          textRef.current,
          { rotation: -10 },
          {
            rotation: 10,
            duration: 1.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          }
        )

        const heading = textRef.current?.querySelector(".uppercase")
        if (!heading) return

        gsap.set(heading, { fontKerning: "none" })

        SplitText.create(heading, {
          type: "chars",
          tag: "span",
          smartWrap: true,
          charsClass: "inline-block",
          autoSplit: true,
          aria: "auto",
          onSplit(self) {
            return createSignDamage(self.chars)
          },
        })
      })

      return () => mm.revert()
    },
    { scope: textRef }
  )

  return (
    <div ref={textRef} className={cn("will-change-transform", className)}>
      {children}
    </div>
  )
}
