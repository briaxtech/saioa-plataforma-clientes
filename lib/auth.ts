import { getServerSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { JWT } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import { sql } from "./db"
import type { User } from "./types"

type SessionOrganization = {
  id: string
  name: string
  slug: string
  domain?: string | null
  logo_url?: string | null
  support_email?: string | null
} | null

const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials.password) {
      throw new Error("Debes ingresar correo y contraseña.")
    }

    const normalizedEmail = credentials.email.toLowerCase()
    const users = await sql`
      SELECT *
      FROM users
      WHERE email = ${normalizedEmail}
    `

    const userRecord = users[0] as (User & { password_hash?: string }) | undefined
    if (!userRecord || !userRecord.password_hash) {
      throw new Error("Credenciales inválidas.")
    }

    const passwordMatch = await bcrypt.compare(credentials.password, userRecord.password_hash)
    if (!passwordMatch) {
      throw new Error("Credenciales inválidas.")
    }

    const organizations = await sql`
      SELECT id, name, slug, domain, logo_url, support_email
      FROM organizations
      WHERE id = ${userRecord.organization_id}
    `

    const organization = organizations[0] || null

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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [credentialsProvider],
  callbacks: {
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
        ;(session as any).organization = typedToken.user.organization ?? null
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
