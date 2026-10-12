import Image from "next/image"

import { Separator } from "@/components/ui/separator"

const paymentPartners = [
  { src: "/images/mercury.webp", alt: "Mercury", width: 238, height: 48, className: "h-5 w-auto" },
  { src: "/images/stripe.webp", alt: "Stripe", width: 148, height: 48, className: "h-7 w-auto" },
  { src: "/images/apple-pay.webp", alt: "Apple Pay", width: 228, height: 240, className: "h-10 w-auto" },
  { src: "/images/g-pay.webp", alt: "Google Pay", width: 66, height: 72, className: "h-6 w-auto" },
  { src: "/images/master-card.webp", alt: "Mastercard", width: 80, height: 80, className: "h-7 w-auto" },
  { src: "/images/visa-card.webp", alt: "Visa", width: 74, height: 72, className: "h-5 w-auto" },
] as const

const socialLinks = [
  {
    src: "/images/x-icon.webp",
    alt: "X",
    width: 38,
    height: 38,
    href: "https://x.com/Idolrun_",
  },
  {
    src: "/images/instagram-icon.webp",
    alt: "Instagram",
    width: 48,
    height: 48,
    href: "https://www.instagram.com/idolrun_entertainment/",
  },
  { src: "/images/facebook-icon.webp", alt: "Facebook", width: 48, height: 48 },
  {
    src: "/images/tictok-icon.webp",
    alt: "TikTok",
    width: 32,
    height: 36,
    href: "https://www.tiktok.com/@idolrun_official?_r=1&_t=ZS-9AUTj72ATav",
  },
] as const

const footerNotes = ["Privacy Policy", "Terms", "Legal", "Cookie Policy"]
const footerLinks = ["About", "Support", "Contact"]

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-10 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-8 sm:px-5">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {footerLinks.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <Separator className="my-5 bg-white/40" />

        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/images/idolrun-logo.png"
              alt="Idolrun Entertainment"
              width={200}
              height={184}
              className="h-[4.5rem] w-auto shrink-0"
            />
            <div>
              <p className="text-xs leading-5 xl:whitespace-nowrap">
                ©2026 Idolrun Entertainment, Inc. All trademarks referenced herein are the
                properties of respective owner
              </p>
              <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {footerNotes.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <p className="text-sm">Our payment partners</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ul className="flex flex-wrap items-center gap-3">
                {paymentPartners.map((partner) => (
                  <li key={partner.alt}>
                    <Image
                      src={partner.src}
                      alt={partner.alt}
                      width={partner.width}
                      height={partner.height}
                      className={partner.className}
                    />
                  </li>
                ))}
              </ul>
              <ul className="flex items-center gap-3">
                {socialLinks.map((social) => {
                  const icon = (
                    <Image
                      src={social.src}
                      alt={social.alt}
                      width={social.width}
                      height={social.height}
                      className="h-5 w-auto"
                    />
                  )

                  return (
                    <li key={social.alt}>
                      {"href" in social ? (
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.alt}
                        >
                          {icon}
                        </a>
                      ) : (
                        icon
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
