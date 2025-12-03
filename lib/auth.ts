import { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { JWT } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import { sql } from "./db"
import type { BrandingSettings, Organization, User } from "./types"
import { checkRateLimit, getClientIp } from "./rate-limit"

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET

type SessionOrganization = Organization | null

function mapOrganization(row: any): SessionOrganization {
  if (!row) return null

  const metadata = (row.metadata || {}) as { branding?: BrandingSettings }
  const branding = { ...(metadata?.branding || {}) }

  if (!branding.logo_url && row.logo_url) {
    branding.logo_url = row.logo_url
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain || null,
    logo_url: row.logo_url || null,
    support_email: row.support_email || null,
    branding: Object.keys(branding).length ? branding : undefined,
    metadata,
  }
}

const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
    slug: { label: "Espacio", type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials.password) {
      throw new Error("Debes ingresar correo y contrasena.")
    }

    const normalizedEmail = credentials.email.toLowerCase()
    const slugInput =
      typeof credentials.slug === "string" && credentials.slug.trim() ? credentials.slug.trim().toLowerCase() : null

    if (!slugInput) {
      throw new Error("Debes indicar el espacio (slug) de tu organizacion.")
    }

    const filteredQuery = `
      SELECT u.*, o.slug
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = $1 AND o.slug = $2
    `
    const users = await sql.unsafe(filteredQuery, [normalizedEmail, slugInput])

    const userRecord = users?.[0] as (User & { password_hash?: string }) | undefined
    if (!userRecord || !userRecord.password_hash) {
      throw new Error("Credenciales invalidas.")
    }

    const passwordMatch = await bcrypt.compare(credentials.password, userRecord.password_hash)
    if (!passwordMatch) {
      throw new Error("Credenciales invalidas.")
    }

    const organizations = await sql`
      SELECT id, name, slug, domain, logo_url, support_email, metadata
      FROM organizations
      WHERE id = ${userRecord.organization_id}
    `

    const organization = mapOrganization(organizations[0])

    const { password_hash: _passwordHash, ...userProfile } = userRecord

    return {
      ...userProfile,
      organization,
    }
  },
})

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [credentialsProvider],
  callbacks: {
    async signIn({ req }) {
      const ip = req ? getClientIp(req as any) : "unknown"
      const rate = checkRateLimit({ key: `login:${ip}`, limit: 10, windowMs: 5 * 60 * 1000 })
      if (!rate.ok) {
        throw new Error("Demasiados intentos de acceso. Intenta nuevamente en unos minutos.")
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = user as User & { organization?: SessionOrganization }
      }
      return token
    },
    async session({ session, token }) {
      const typedToken = token as JWT & { user?: User & { organization?: SessionOrganization } }
      if (typedToken.user) {
        session.user = typedToken.user as any

        let organization: SessionOrganization = typedToken.user.organization ?? null
        if (typedToken.user.organization_id) {
          try {
            const rows = await sql`
              SELECT id, name, slug, domain, logo_url, support_email, metadata
              FROM organizations
              WHERE id = ${typedToken.user.organization_id}
            `
            organization = mapOrganization(rows[0])
          } catch (error) {
            console.error("[auth] Failed to refresh organization for session", error)
          }
        }

        ;(session as any).organization = organization ?? null
        ;(session.user as any).organization = organization ?? null
      }
      return session
    },
  },
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session.user as User
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(roles: User["role"][]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}
