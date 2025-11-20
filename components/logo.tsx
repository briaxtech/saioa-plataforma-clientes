import Image from "next/image"
import { cn } from "@/lib/utils"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"

interface LogoProps {
  className?: string
  priority?: boolean
}

export function Logo({ className = "", priority = false }: LogoProps) {
  return (
    <div className={cn("relative flex w-auto items-center", className)}>
      <Image
        src="/sentir-logo.svg"
        alt={APP_NAME}
        width={180}
        height={52}
        priority={priority}
        className="h-auto w-full max-w-[180px] object-contain"
      />
    </div>
  )
}
