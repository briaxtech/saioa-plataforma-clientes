import type { DefaultSession } from "next-auth"
import type { UserRole } from "@/lib/types"

declare module "next-auth" {
  interface Session extends DefaultSession {
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
    } | null
  }

  interface User extends Session["user"] {
    organization?: Session["organization"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: import("next-auth").User
  }
}
