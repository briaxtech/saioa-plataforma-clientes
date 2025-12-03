import { randomBytes } from "crypto"

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://example.com"

export const parseJSONField = (value: any) => {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return value || []
}

export const generateTemporaryPassword = (length = 12) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  const randomBuffer = randomBytes(length)
  let password = ""

  for (let i = 0; i < length; i++) {
    password += charset[randomBuffer[i] % charset.length]
  }

  return password
}

export const buildWelcomeEmailHtml = ({
  clientName,
  appBaseUrl,
  clientEmail,
  temporaryPassword,
}: {
  clientName: string
  appBaseUrl: string
  clientEmail: string
  temporaryPassword: string
}) => {
  const normalizedBaseUrl = appBaseUrl.replace(/\/$/, "")
  const loginUrl = `${normalizedBaseUrl}/login`

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:40px;background:linear-gradient(120deg,#0d9488,#0891b2);color:#ffffff;">
              <h1 style="margin:0;font-size:28px;font-weight:600;">Bienvenido a ${APP_NAME}</h1>
              <p style="margin:12px 0 0;font-size:16px;opacity:0.9;">Ya puedes seguir tu caso desde nuestra plataforma.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;color:#0f172a;">
              <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hola ${clientName},</p>
              <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
                Tu expediente ya fue creado en nuestro panel para clientes. Desde ahora vas a poder revisar el estado de tu tramite, subir documentacion requerida y conversar directamente con tu abogada.
              </p>
              <div style="margin:24px 0;padding:20px;border:1px dashed #0d9488;border-radius:12px;background:#f0fdfa;">
                <p style="font-size:15px;margin:0 0 8px;">Puedes ingresar con:</p>
                <p style="font-size:15px;margin:0;"><strong>Usuario:</strong> ${clientEmail}</p>
                <p style="font-size:15px;margin:8px 0 0;"><strong>Contrasena temporal:</strong> <span style="font-size:18px;letter-spacing:2px;">${temporaryPassword}</span></p>
                <p style="font-size:13px;margin:12px 0 0;color:#0f172a;">Por seguridad, te pedimos cambiar esta contrasena desde la seccion "Perfil & Seguridad" apenas ingreses.</p>
              </div>
              <div style="margin:32px 0;text-align:center;">
                <a href="${loginUrl}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:15px;font-weight:600;display:inline-block;">
                  Ingresar a la plataforma
                </a>
              </div>
              <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                Si necesitas asistencia adicional, responde este correo o comunicate con nosotros. Estamos atentos para acompanarte en cada paso.
              </p>
              <p style="font-size:15px;margin:24px 0 0;">Equipo ${APP_NAME}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;background:#f9fafb;text-align:center;">
              <img src="${normalizedBaseUrl}/logo.png" alt="${APP_NAME}" style="height:32px;margin-bottom:8px;" />
              <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; ${new Date().getFullYear()} ${APP_NAME} - Todos los derechos reservados</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`
}

export const parseSenderAddress = (value: string): { email: string; name?: string } => {
  const trimmed = value.trim()
  const match = trimmed.match(/^(.*)<(.+)>$/)
  if (match) {
    return {
      email: match[2].trim(),
      name: match[1].trim().replace(/^"|"$/g, ""),
    }
  }

  return { email: trimmed, name: undefined }
}
