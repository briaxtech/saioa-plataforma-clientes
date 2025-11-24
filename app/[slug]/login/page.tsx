import { LoginView } from "@/components/login-view"
import { useParams } from "next/navigation"

export default function TenantLoginPage() {
  const params = useParams() as { slug?: string }
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params?.slug[0] : undefined

  return <LoginView slug={slug} />
}
"use client"
