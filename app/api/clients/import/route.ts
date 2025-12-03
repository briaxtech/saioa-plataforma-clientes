import { randomUUID } from "crypto"
import { Buffer } from "node:buffer"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Resend } from "resend"
import * as XLSX from "xlsx"
import { getCurrentUser } from "@/lib/auth"
import { sql, logActivity } from "@/lib/db"
import {
  APP_BASE_URL,
  APP_NAME,
  buildWelcomeEmailHtml,
  generateTemporaryPassword,
  parseJSONField,
  parseSenderAddress,
} from "@/lib/client-onboarding"

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 500
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high", "urgent"])
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type TemplatesMap = Map<string, any>

const normalizeKey = (key: string) => key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "")

const sanitizeValue = (value: any) => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.trim()
  return String(value).trim()
}

const normalizeRow = (row: Record<string, any>) => {
  const normalized: Record<string, any> = {}
  Object.entries(row || {}).forEach(([key, value]) => {
    if (!key) return
    normalized[normalizeKey(key)] = sanitizeValue(value)
  })
  return normalized
}

const isRowEmpty = (row: Record<string, any>) => Object.values(row).every((value) => sanitizeValue(value) === "")

const pickValue = (row: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const normalizedKey = normalizeKey(key)
    const value = row[normalizedKey]
    if (value !== undefined && value !== null && sanitizeValue(value) !== "") {
      return sanitizeValue(value)
    }
  }
  return ""
}

const createCaseFromTemplate = async ({
  template,
  tenantId,
  clientId,
  staffId,
  priority,
}: {
  template: any
  tenantId: string
  clientId: string
  staffId: string
  priority: string
}) => {
  const prefixFromId = template.id
    ?.split("-")
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("")
  const generatedPrefix =
    prefixFromId && prefixFromId.length >= 2
      ? prefixFromId
      : template.name
          .split(" ")
          .map((word: string) => word[0])
          .join("")
          .slice(0, 3)
          .toUpperCase() || "CAS"

  const caseNumber = `${generatedPrefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`
  const baseCaseType = template.base_case_type || "other"

  const newCaseResult = await sql`
    INSERT INTO cases (
      organization_id, case_number, client_id, assigned_staff_id, case_type,
      title, description, priority, case_type_template_id
    )
    VALUES (
      ${tenantId}, ${caseNumber}, ${clientId}, ${staffId}, ${baseCaseType},
      ${template.name}, ${template.description || null}, ${priority}, ${template.id}
    )
    RETURNING *
  `

  const createdCase = newCaseResult[0]

  await sql`
    UPDATE clients
    SET case_count = case_count + 1
    WHERE user_id = ${clientId} AND organization_id = ${tenantId}
  `

  const templateStates: string[] = parseJSONField(template.states)

  await Promise.all(
    templateStates.map((state: string, index: number) =>
      sql`
        INSERT INTO case_milestones (organization_id, case_id, title, order_index)
        VALUES (${tenantId}, ${createdCase.id}, ${state}, ${index + 1})
      `,
    ),
  )

  const templateDocuments: any[] = parseJSONField(template.documents)
  if (templateDocuments.length > 0) {
    const insertPromises = templateDocuments
      .map((entry: any) => {
        const docName = typeof entry === "string" ? entry : entry?.name
        if (!docName) return null
        const docCategory = typeof entry === "object" ? entry?.category || null : null
        const docDescription =
          typeof entry === "object" ? entry?.description || entry?.notes || entry?.instruction || null : null

        return sql`
          INSERT INTO documents (organization_id, case_id, name, description, category, is_required, status, created_at, updated_at)
          VALUES (${tenantId}, ${createdCase.id}, ${docName}, ${docDescription}, ${docCategory}, TRUE, 'pending', NOW(), NOW())
        `
      })
      .filter(Boolean)

    await Promise.all(insertPromises as Promise<any>[])
  }

  return createdCase
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const sendInvitesParam = formData.get("sendInvites")
    const defaultCaseTypeId = typeof formData.get("caseTypeId") === "string" ? String(formData.get("caseTypeId")).trim() : ""
    const defaultPriorityRaw =
      typeof formData.get("priority") === "string" ? String(formData.get("priority")).trim().toLowerCase() : "medium"
    const defaultPriority = ALLOWED_PRIORITIES.has(defaultPriorityRaw) ? defaultPriorityRaw : "medium"
    const sendInvites = sendInvitesParam === null ? true : String(sendInvitesParam).toLowerCase() === "true"

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Archivo no encontrado en la solicitud." }, { status: 400 })
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Formato de archivo no soportado." }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Maximo 5MB." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let workbook
    try {
      workbook = XLSX.read(buffer, { type: "buffer" })
    } catch (error) {
      console.error("[v0] Failed to parse import file:", error)
      return NextResponse.json({ error: "No pudimos leer el archivo. Usa CSV o Excel (.xlsx)." }, { status: 400 })
    }

    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return NextResponse.json({ error: "El archivo esta vacio." }, { status: 400 })
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[firstSheetName], { defval: "" })

    if (rows.length === 0) {
      return NextResponse.json({ error: "No encontramos filas para importar." }, { status: 400 })
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Limite maximo: ${MAX_ROWS} filas por importacion.` }, { status: 400 })
    }

    const tenantId = user.organization_id

    const templates = await sql`
      SELECT *
      FROM case_type_templates
      WHERE organization_id = ${tenantId} OR organization_id IS NULL
    `

    const templatesById: TemplatesMap = new Map()
    const templatesByName: TemplatesMap = new Map()
    templates.forEach((template: any) => {
      templatesById.set(String(template.id), template)
      templatesByName.set(String(template.name || "").trim().toLowerCase(), template)
    })

    let defaultTemplate = null
    if (defaultCaseTypeId) {
      defaultTemplate = templatesById.get(defaultCaseTypeId) || templatesById.get(defaultCaseTypeId.toLowerCase())
      if (!defaultTemplate) {
        return NextResponse.json({ error: "El tipo de caso seleccionado no existe." }, { status: 400 })
      }
    }

    const existingUsers = await sql`
      SELECT email
      FROM users
      WHERE organization_id = ${tenantId}
    `
    const existingEmails = new Set<string>()
    existingUsers.forEach((row: any) => {
      if (row.email) existingEmails.add(String(row.email).toLowerCase())
    })

    const results = {
      created: [] as Array<{ email: string; name: string; temporaryPassword: string; caseNumber?: string; caseType?: string }>,
      skipped: [] as Array<{ email?: string; row: number; reason: string }>,
      errors: [] as Array<{ row: number; error: string }>,
      warnings: [] as string[],
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM
    const canSendEmails = Boolean(resendApiKey && emailFrom && sendInvites)
    const resend = canSendEmails ? new Resend(resendApiKey) : null

    if (sendInvites && !resendApiKey) {
      results.warnings.push("No se enviaron correos: falta RESEND_API_KEY.")
    }
    if (sendInvites && !emailFrom) {
      results.warnings.push("No se enviaron correos: falta RESEND_FROM_EMAIL/EMAIL_FROM.")
    }

    for (let index = 0; index < rows.length; index++) {
      const rowNumber = index + 2 // asumiendo fila 1 como encabezado
      const normalizedRow = normalizeRow(rows[index])

      if (isRowEmpty(normalizedRow)) {
        continue
      }

      const name = pickValue(normalizedRow, ["nombre", "nombre completo", "name", "full name"])
      const email = pickValue(normalizedRow, ["correo", "correo electronico", "email", "mail", "correo_electronico"]).toLowerCase()
      const phone = pickValue(normalizedRow, ["telefono", "phone", "celular", "whatsapp"])
      const country = pickValue(normalizedRow, ["pais", "pais origen", "country", "country of origin", "pais_origen"])
      const notes = pickValue(normalizedRow, ["notas", "notes", "comentarios", "observaciones"])
      const caseTypeInput = pickValue(normalizedRow, ["tipo de caso", "tipocaso", "plantilla", "template", "case type", "case_type_id"])
      const priorityInput =
        pickValue(normalizedRow, ["prioridad", "priority"]).toLowerCase() || defaultPriority
      const priority = ALLOWED_PRIORITIES.has(priorityInput) ? priorityInput : defaultPriority

      if (!name || !email) {
        results.errors.push({ row: rowNumber, error: "Falta nombre o correo." })
        continue
      }

      if (!EMAIL_REGEX.test(email)) {
        results.errors.push({ row: rowNumber, error: "Correo invalido." })
        continue
      }

      if (existingEmails.has(email)) {
        results.skipped.push({ row: rowNumber, email, reason: "Ya existe un usuario con este correo en tu organizacion." })
        continue
      }

      let resolvedTemplate = null
      if (caseTypeInput) {
        const normalizedTemplateKey = caseTypeInput.trim().toLowerCase()
        resolvedTemplate =
          templatesById.get(caseTypeInput) ||
          templatesById.get(normalizedTemplateKey) ||
          templatesByName.get(normalizedTemplateKey)
        if (!resolvedTemplate) {
          results.errors.push({ row: rowNumber, error: `Tipo de caso/plantilla no encontrado: ${caseTypeInput}` })
          continue
        }
      } else if (defaultTemplate) {
        resolvedTemplate = defaultTemplate
      }

      try {
        const temporaryPassword = generateTemporaryPassword()
        const passwordHash = await bcrypt.hash(temporaryPassword, 12)
        const newUserId = randomUUID()

        await sql`
          INSERT INTO users (id, organization_id, name, email, role, phone, country_of_origin, password_hash)
          VALUES (${newUserId}, ${tenantId}, ${name}, ${email}, 'client', ${phone || null}, ${country || null}, ${passwordHash})
        `

        const clientResult = await sql`
          INSERT INTO clients (organization_id, user_id, assigned_staff_id, notes)
          VALUES (${tenantId}, ${newUserId}, ${user.id}, ${notes || null})
          RETURNING *
        `

        let createdCase: any = null
        if (resolvedTemplate) {
          createdCase = await createCaseFromTemplate({
            template: resolvedTemplate,
            tenantId,
            clientId: newUserId,
            staffId: user.id,
            priority,
          })
        }

        existingEmails.add(email)

        if (canSendEmails && resend) {
          const { email: senderEmail, name: senderName } = parseSenderAddress(emailFrom || "")
          if (senderEmail) {
            const html = buildWelcomeEmailHtml({
              clientName: name,
              appBaseUrl: APP_BASE_URL,
              clientEmail: email,
              temporaryPassword,
            })
            const fromAddress = senderName ? `${senderName} <${senderEmail}>` : senderEmail
            try {
              await resend.emails.send({
                from: fromAddress,
                to: [email],
                subject: `Tu acceso a ${APP_NAME}`,
                html,
              })
            } catch (sendError) {
              console.error("[v0] Failed to send import welcome email:", sendError)
              results.warnings.push(`No se pudo enviar el correo a ${email}.`)
            }
          }
        }

        results.created.push({
          email,
          name,
          temporaryPassword,
          caseNumber: createdCase?.case_number,
          caseType: resolvedTemplate?.name,
        })
      } catch (error: any) {
        console.error("[v0] Failed to import client row:", error)
        results.errors.push({ row: rowNumber, error: "No se pudo crear el cliente." })
      }
    }

    await logActivity(tenantId, user.id, "clients_imported", `Importaste ${results.created.length} clientes`, undefined, {
      skipped: results.skipped.length,
      errors: results.errors.length,
      file: (file as any)?.name || "upload",
      sendInvites,
    })

    return NextResponse.json(
      {
        summary: {
          totalRows: rows.length,
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
        },
        ...results,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Failed to import clients:", error)
    return NextResponse.json({ error: "No se pudo procesar la importacion." }, { status: 500 })
  }
}
