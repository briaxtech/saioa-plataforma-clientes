import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role === "admin" || user.role === "staff") {
      // Admin/Staff stats
      const [totalCases] = await sql`SELECT COUNT(*) as count FROM cases`
      const [activeCases] = await sql`
        SELECT COUNT(*) as count FROM cases 
        WHERE status IN ('pending', 'in_progress', 'under_review')
      `
      const [totalClients] = await sql`SELECT COUNT(*) as count FROM clients`
      const [pendingDocs] = await sql`
        SELECT COUNT(*) as count FROM documents 
        WHERE status = 'pending'
      `

      return NextResponse.json({
        stats: {
          totalCases: Number(totalCases.count),
          activeCases: Number(activeCases.count),
          totalClients: Number(totalClients.count),
          pendingDocuments: Number(pendingDocs.count),
        },
      })
    } else {
      // Client stats
      const [cases] = await sql`
        SELECT COUNT(*) as count FROM cases WHERE client_id = ${user.id}
      `
      const [documents] = await sql`
        SELECT COUNT(*) as count FROM documents d
        JOIN cases c ON d.case_id = c.id
        WHERE c.client_id = ${user.id}
      `
      const [messages] = await sql`
        SELECT COUNT(*) as count FROM messages 
        WHERE receiver_id = ${user.id} AND status != 'read'
      `

      return NextResponse.json({
        stats: {
          totalCases: Number(cases.count),
          totalDocuments: Number(documents.count),
          unreadMessages: Number(messages.count),
        },
      })
    }
  } catch (error) {
    console.error("[v0] Failed to fetch stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
