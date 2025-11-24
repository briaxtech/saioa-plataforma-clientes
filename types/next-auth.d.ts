import type { DefaultSession } from "next-auth"
import type { BrandingSettings, UserRole } from "@/lib/types"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      email: string
      name: string
      role: UserRole
      organization_id: string
      phone?: string | null
      address?: string | null
      date_of_birth?: string | null
      country_of_origin?: string | null
      avatar_url?: string | null
      created_at?: string
      updated_at?: string
    }
    organization?: {
      id: string
      name: string
      slug: string
      domain?: string | null
      logo_url?: string | null
      support_email?: string | null
      branding?: BrandingSettings
    } | null
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    organization_id: string
    phone?: string | null
    address?: string | null
    date_of_birth?: string | null
    country_of_origin?: string | null
    avatar_url?: string | null
    created_at?: string
    updated_at?: string
    organization?: Session["organization"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: import("next-auth").User
  }
}
