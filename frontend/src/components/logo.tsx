import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

export function Logo({ size = 24, className, style, ...props }: LogoProps) {
  return (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <Image
        src="/logo_only.png"
        alt="Logo Resmi APLI DAKOP"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
      />
    </div>
  )
}

