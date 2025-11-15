import { type NextRequest, NextResponse } from "next/server"
import { GoogleDriveService } from "@/lib/google-drive"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // case_id

    if (!code) {
      return NextResponse.redirect("/admin/dashboard?error=auth_failed")
    }

    const config = {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google-drive/callback`,
    }

    // Exchange code for tokens
    const tokens = await GoogleDriveService.getAccessToken(config, code)

    // Store tokens (in production, encrypt and store in database)
    // For now, create a folder for the case if state (case_id) is provided
    if (state) {
      const driveService = new GoogleDriveService(tokens.access_token)

      const cases = await sql`SELECT * FROM cases WHERE id = ${state}`
      if (cases.length > 0) {
        const caseData = cases[0]
        const folderId = await driveService.createFolder(`Case ${caseData.case_number} - ${caseData.title}`)

        // Update case with folder ID
        await sql`
          UPDATE cases
          SET google_drive_folder_id = ${folderId}
          WHERE id = ${state}
        `

        return NextResponse.redirect(`/admin/cases/${state}?success=drive_connected`)
      }
    }

    return NextResponse.redirect("/admin/dashboard?success=drive_connected")
  } catch (error) {
    console.error("[v0] Google Drive callback error:", error)
    return NextResponse.redirect("/admin/dashboard?error=drive_failed")
  }
}
