import {
  PrismaClient,
  UserRole,
  CaseType,
  CaseStatus,
  CaseLifecycleStatus,
  PriorityLevel,
  CaseStageStatus,
  DocumentStatus,
} from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const defaultPasswordHash = await bcrypt.hash("demo123", 10)
  const superAdminPasswordHash = await bcrypt.hash("SuperAdmin!23", 10)

  // Limpieza en cascada (hijos -> padres)
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
  await prisma.superAdmin.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // Superusuario para panel de SuperAdmin
  await prisma.superAdmin.create({
    data: {
      email: "superadmin@demo.com",
      passwordHash: superAdminPasswordHash,
      status: "active",
      metadata: { notes: "Seed de desarrollo" },
    },
  })

  // 1) Tenant demo
  const organization = await prisma.organization.create({
    data: {
      id: "org-demo",
      name: "Agencia Demo",
      slug: "demo",
      domain: "demo.local",
      supportEmail: "soporte@demo.com",
      metadata: {
        is_demo: true,
        demo_limits: { uploadsPerDay: 3, messagesPerDay: 10, maxSizeMb: 1, ttlMinutes: 30 },
        demo_accounts: { admin_email: "admin@demo.com", client_email: "cliente.demo@demo.com", password: "demo123" },
        branding: {
          palette: {
            primary: "#36ccca",
            accent: "#19b4bb",
            background: "#f4fbfb",
            foreground: "#04152d",
            card: "#ffffff",
            sidebar: "#031247",
            border: "#c2d8da",
            muted: "#d9ecec",
          },
        },
      },
    },
  })

  // 1b) Tenant real (no demo)
  const realOrg = await prisma.organization.create({
    data: {
      id: "org-real",
      name: "Agencia Real",
      slug: "real",
      domain: "real.local",
      supportEmail: "soporte@real.com",
    },
  })

  // 2) Template base de caso
  const template = await prisma.caseTypeTemplate.create({
    data: {
      id: "residencia-familiares-ue",
      organizationId: organization.id,
      name: "Residencia familiar UE",
      description: "Tarjeta comunitaria para conyuges y familiares directos de ciudadanos UE.",
      documents: ["Pasaporte vigente", "Certificado de matrimonio legalizado", "Empadronamiento conjunto", "Medios economicos"],
      states: ["Revision documental", "Cita en extranjeria", "Resolucion", "Entrega"],
      timeframe: "Entre 3 y 4 meses segun provincia.",
      baseCaseType: CaseType.family,
    },
  })

  // 3) Usuarios internos
  const admin = await prisma.user.create({
    data: {
      id: "admin-001",
      organizationId: organization.id,
      name: "Admin Demo",
      email: "admin@demo.com",
      role: UserRole.admin,
      phone: "+34 910 000 000",
      passwordHash: defaultPasswordHash,
    },
  })

  // 4) Usuario cliente + Client
  const clientUser = await prisma.user.create({
    data: {
      id: "client-001",
      organizationId: organization.id,
      name: "Maria Fernandez",
      email: "cliente.demo@demo.com",
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
      assignedStaffId: admin.id,
    },
  })

  // 5) Caso de ejemplo
  const demoCase = await prisma.case.create({
    data: {
      organizationId: organization.id,
      caseNumber: "CASE-DEMO-0001",
      clientId: clientUser.id,
      assignedStaffId: admin.id,
      caseTypeTemplateId: template.id,
      caseType: CaseType.family,
      status: CaseStatus.in_progress,
      lifecycleStatus: CaseLifecycleStatus.preparation,
      priority: PriorityLevel.medium,
      title: "Tarjeta comunitaria para Maria Fernandez",
      description: "Caso demo de residencia de familiar de ciudadano UE.",
      contactName: "Maria Fernandez",
      contactEmail: clientUser.email,
      contactPhone: clientUser.phone,
    },
  })

  // 6) Milestones de ejemplo
  await prisma.caseMilestone.createMany({
    data: [
      {
        organizationId: organization.id,
        caseId: demoCase.id,
        title: "Revision documental",
        description: "Verificar que toda la documentacion este completa y vigente.",
        orderIndex: 1,
        status: CaseStageStatus.in_progress,
      },
      {
        organizationId: organization.id,
        caseId: demoCase.id,
        title: "Preparar cita en extranjeria",
        description: "Solicitar cita y preparar documentacion final.",
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
      storagePath: `tenants/${organization.id}/cases/${demoCase.caseNumber}/pasaporte-maria.pdf`,
      fileUrl: "https://example.com/fake-supabase-url.pdf",
      status: DocumentStatus.submitted,
      isRequired: true,
      category: "Identidad",
    },
  })

  // Usuarios base para org real
  const realAdmin = await prisma.user.create({
    data: {
      id: "admin-real-001",
      organizationId: realOrg.id,
      name: "Admin Real",
      email: "admin@real.com",
      role: UserRole.admin,
      phone: "+34 910 111 111",
      passwordHash: defaultPasswordHash,
    },
  })

  const realClientUser = await prisma.user.create({
    data: {
      id: "client-real-001",
      organizationId: realOrg.id,
      name: "Cliente Real",
      email: "cliente@real.com",
      role: UserRole.client,
      phone: "+34 600 111 111",
      passwordHash: defaultPasswordHash,
    },
  })

  await prisma.client.create({
    data: {
      organizationId: realOrg.id,
      userId: realClientUser.id,
      caseCount: 0,
      notes: "Cliente real de ejemplo",
      assignedStaffId: realAdmin.id,
    },
  })

  console.log("Seed completado con tenant demo, usuarios y un caso de ejemplo.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
