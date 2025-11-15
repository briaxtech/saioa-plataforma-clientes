// Google Drive integration utilities
// Users need to add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI env vars

export interface GoogleDriveConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export class GoogleDriveService {
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  // Generate OAuth URL for users to authorize
  static getAuthUrl(config: GoogleDriveConfig, state?: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ].join(" ")

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent",
      ...(state && { state }),
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  // Exchange authorization code for access token
  static async getAccessToken(config: GoogleDriveConfig, code: string): Promise<any> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get access token")
    }

    return response.json()
  }

  // Create a folder in Google Drive
  async createFolder(name: string, parentId?: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error("Not authenticated")
    }

    const metadata: any = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    }

    if (parentId) {
      metadata.parents = [parentId]
    }

    const response = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    })

    if (!response.ok) {
      throw new Error("Failed to create folder")
    }

    const data = await response.json()
    return data.id
  }

  // Upload file to Google Drive
  async uploadFile(file: File | Buffer, fileName: string, mimeType: string, folderId?: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error("Not authenticated")
    }

    const metadata: any = {
      name: fileName,
      mimeType,
    }

    if (folderId) {
      metadata.parents = [folderId]
    }

    // Create multipart upload
    const boundary = "-------314159265358979323846"
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    let fileContent: Buffer
    if (file instanceof Buffer) {
      fileContent = file
    } else {
      fileContent = Buffer.from(await file.arrayBuffer())
    }

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      fileContent.toString("binary") +
      closeDelimiter

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file")
    }

    const data = await response.json()
    return data.id
  }

  // Get file metadata
  async getFileMetadata(fileId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to get file metadata")
    }

    return response.json()
  }

  // List files in a folder
  async listFiles(folderId?: string): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated")
    }

    let query = folderId ? `'${folderId}' in parents` : ""
    query += (query ? " and " : "") + "trashed=false"

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime)`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to list files")
    }

    const data = await response.json()
    return data.files || []
  }

  // Share folder with user
  async shareFolder(folderId: string, email: string, role: "reader" | "writer" = "writer"): Promise<void> {
    if (!this.accessToken) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "user",
        role,
        emailAddress: email,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to share folder")
    }
  }
}
