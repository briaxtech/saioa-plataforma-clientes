import { type NextRequest, NextResponse } from "next/server"
import { GoogleDriveService } from "@/lib/google-drive"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("case_id")

    const config = {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google-drive/callback`,
    }

    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json(
        { error: "Google Drive not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." },
        { status: 500 },
      )
    }

    const authUrl = GoogleDriveService.getAuthUrl(config, caseId || undefined)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("[v0] Failed to generate auth URL:", error)
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 })
  }
}
