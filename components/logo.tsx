import Image from "next/image"
import { cn } from "@/lib/utils"
import { DEFAULT_LOGO_URL } from "@/lib/branding"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"

interface LogoProps {
  className?: string
  priority?: boolean
  src?: string | null
  alt?: string
}

export function Logo({ className = "", priority = false, src, alt }: LogoProps) {
  const logoSrc = src && src.trim() !== "" ? src : DEFAULT_LOGO_URL
  const altText = alt || APP_NAME

  return (
    <div className={cn("relative flex w-auto items-center", className)}>
      <Image
        src={logoSrc}
        alt={altText}
        width={180}
        height={52}
        priority={priority}
        className="h-auto w-full max-w-[180px] object-contain"
      />
    </div>
  )
}
