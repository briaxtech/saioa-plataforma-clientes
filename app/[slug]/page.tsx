import { redirect } from "next/navigation"

export default function TenantRoot({ params }: { params: { slug: string } }) {
  const slug = params?.slug
  redirect(`/${slug}/login`)
}
