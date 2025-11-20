import { PrismaClient, UserRole, CaseType, CaseStatus, CaseLifecycleStatus, PriorityLevel, CaseStageStatus, DocumentStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const defaultPasswordHash = await bcrypt.hash("demo123", 10)

  // Limpieza completa en orden hijos → padres
  await prisma.caseKeyDateReminder.deleteMany()
  await prisma.caseKeyDate.deleteMany()
  await prisma.caseContact.deleteMany()
  await prisma.caseEvent.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.document.deleteMany()
  await prisma.caseMilestone.deleteMany()
  await prisma.case.deleteMany()
  await prisma.client.deleteMany()
  await prisma.caseTypeTemplate.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // 1) Tenant demo
  const organization = await prisma.organization.create({
    data: {
      id: "org-sentir",
      name: "Sentir Extranjero",
      slug: "sentir",
      domain: "sentir.local",
      supportEmail: "coordinacion@sentirextranjero.com",
    },
  })

  // 2) Template base de caso
  const template = await prisma.caseTypeTemplate.create({
    data: {
      id: "residencia-familiares-ue",
      organizationId: organization.id,
      name: "Residencia de familiares de ciudadanos UE",
      description:
        "Tarjeta comunitaria para conyuges y familiares directos de ciudadanos espanoles o de la UE.",
      documents: [
        "Pasaporte vigente",
        "Certificado de matrimonio o vinculo familiar legalizado",
        "Certificado de empadronamiento conjunto",
        "Medios economicos del ciudadano europeo",
      ],
      states: [
        "Revision documental",
        "Cita en extranjeria",
        "Resolucion",
        "Toma de huellas y entrega",
      ],
      timeframe:
        "Entre 3 y 4 meses en Madrid (puede variar segun provincia).",
      baseCaseType: CaseType.family, // o "family" si no importas el enum
    },
  })

  // 3) Usuarios internos
  const admin = await prisma.user.create({
    data: {
      id: "admin-001",
      organizationId: organization.id,
      name: "Coordinacion Demo",
      email: "admin@demo.com",
      role: UserRole.admin,
      phone: "+34 910 000 000",
      passwordHash: defaultPasswordHash,
    },
  })

  const staff1 = await prisma.user.create({
    data: {
      id: "staff-001",
      organizationId: organization.id,
      name: "Laura Garcia",
      email: "laura.garcia@sentirextranjero.com",
      role: "staff",
      phone: "+34 910 000 001",
      passwordHash: defaultPasswordHash,
    },
  })

  const staff2 = await prisma.user.create({
    data: {
      id: "staff-002",
      organizationId: organization.id,
      name: "Diego Martinez",
      email: "diego.martinez@sentirextranjero.com",
      role: "staff",
      phone: "+34 910 000 002",
      passwordHash: defaultPasswordHash,
    },
  })

  // 4) Usuario cliente + Client
  const clientUser = await prisma.user.create({
    data: {
      id: "client-001",
      organizationId: organization.id,
      name: "Maria Fernandez",
      email: "maria.fernandez+demo@sentir.com",
      role: UserRole.client,
      phone: "+34 600 000 000",
      passwordHash: defaultPasswordHash,
    },
  })

  const client = await prisma.client.create({
    data: {
      organizationId: organization.id,
      userId: clientUser.id,
      caseCount: 0,
      notes: "Cliente demo para pruebas de la plataforma",
    },
  })

  // 5) Caso de ejemplo
  const demoCase = await prisma.case.create({
    data: {
      organizationId: organization.id,
      caseNumber: "CASE-DEM0-0001",
      clientId: clientUser.id,
      assignedStaffId: "staff-001", // si quieres usar Laura como responsable
      caseTypeTemplateId: template.id,
      caseType: CaseType.family,
      status: CaseStatus.in_progress,
      lifecycleStatus: CaseLifecycleStatus.preparation,
      priority: PriorityLevel.medium,
      title: "Tarjeta comunitaria para Maria Fernandez",
      description: "Caso demo de residencia de familiar de ciudadano UE.",
      contactName: "Maria Fernandez",
      contactEmail: "maria.fernandez+demo@sentir.com",
      contactPhone: "+34 600 000 000",
    },
  })

  // 6) Milestone de ejemplo
  await prisma.caseMilestone.createMany({
    data: [
      {
        organizationId: organization.id,
        caseId: demoCase.id,
        title: "Revisión documental",
        description: "Verificar que toda la documentación esté completa y vigente.",
        orderIndex: 1,
        status: CaseStageStatus.in_progress,
      },
      {
        organizationId: organization.id,
        caseId: demoCase.id,
        title: "Preparar cita en extranjería",
        description: "Preparar y solicitar cita para presentación.",
        orderIndex: 2,
        status: CaseStageStatus.pending,
      },
    ],
  })

  // 7) Documento de ejemplo
  await prisma.document.create({
    data: {
      organizationId: organization.id,
      caseId: demoCase.id,
      uploaderId: admin.id,
      name: "Pasaporte vigente - Maria Fernandez.pdf",
      description: "Documento de ejemplo subido en el seed.",
      storagePath:
        "tenants/org-sentir/cases/CASE-DEM0-0001/pasaporte-maria.pdf",
      fileUrl: "https://example.com/fake-supabase-url.pdf", // lo cambias cuando integres Storage real
      status: DocumentStatus.submitted,
      isRequired: true,
      category: "Identidad",
    },
  })

  console.log("Seed completado con tenant demo, admin, staff, client y un caso de ejemplo.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
