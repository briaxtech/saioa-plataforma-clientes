import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  priority?: boolean
}

export function Logo({ className = "", priority = false }: LogoProps) {
  return (
    <div className={cn("relative flex w-auto items-center", className)}>
      <Image
        src="/sentir-logo.svg"
        alt="Sentir Extranjero"
        width={180}
        height={52}
        priority={priority}
        className="h-auto w-full max-w-[180px] object-contain"
      />
    </div>
  )
}
