"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react"

interface Organization {
  id: string
  name: string
  slug: string
  domain?: string | null
  logo_url?: string | null
  support_email?: string | null
}

interface AuthContextType {
  user: any | null
  organization: Organization | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthStateProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const login = async (email: string, password: string) => {
    setIsTransitioning(true)
    try {
      const result = await signIn("credentials", { redirect: false, email, password })
      if (result?.error) {
        throw new Error(result.error === "CredentialsSignin" ? "Credenciales inválidas" : result.error)
      }
    } finally {
      setIsTransitioning(false)
    }
  }

  const logout = async () => {
    setIsTransitioning(true)
    try {
      await signOut({ redirect: false })
    } finally {
      setIsTransitioning(false)
    }
  }

  const organization = useMemo(() => {
    if (session && "organization" in session) {
      return (session as any).organization as Organization | null
    }
    return (session?.user as any)?.organization || null
  }, [session])

  const value: AuthContextType = {
    user: (session?.user as any) ?? null,
    organization,
    isLoading: status === "loading" || isTransitioning,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <AuthStateProvider>{children}</AuthStateProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
