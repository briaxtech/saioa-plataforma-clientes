import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.caseTypeTemplate.upsert({
    where: { id: "residencia-familiares-ue" },
    update: {
      name: "Residencia de familiares de ciudadanos UE",
      description: "Tramite comunitario para conyuges y familiares directos de ciudadanos espanoles o de la UE.",
      documents: [
        "Pasaporte vigente",
        "Certificado de matrimonio o vinculo familiar legalizado",
        "Certificado de empadronamiento conjunto",
        "Medios economicos del ciudadano europeo",
      ],
      states: ["Revision documental", "Cita en extranjeria", "Resolucion", "Toma de huellas y entrega"],
      timeframe: "Entre 3 y 4 meses en Madrid (puede variar segun provincia).",
      baseCaseType: "family" as any,
    },
    create: {
      id: "residencia-familiares-ue",
      name: "Residencia de familiares de ciudadanos UE",
      description: "Tramite comunitario para conyuges y familiares directos de ciudadanos espanoles o de la UE.",
      documents: [
        "Pasaporte vigente",
        "Certificado de matrimonio o vinculo familiar legalizado",
        "Certificado de empadronamiento conjunto",
        "Medios economicos del ciudadano europeo",
      ],
      states: ["Revision documental", "Cita en extranjeria", "Resolucion", "Toma de huellas y entrega"],
      timeframe: "Entre 3 y 4 meses en Madrid (puede variar segun provincia).",
      baseCaseType: "family" as any,
    },
  })

  await prisma.user.upsert({
    where: { id: "admin-001" },
    update: {},
    create: {
      id: "admin-001",
      name: "Coordinacion Sentir",
      email: "admin@sentirextranjero.com",
      role: "admin" as any,
      phone: "+34910000000",
    },
  })

  const staff1 = await prisma.user.upsert({
    where: { id: "staff-001" },
    update: {},
    create: {
      id: "staff-001",
      name: "Laura Garcia",
      email: "laura.garcia@sentirextranjero.com",
      role: "staff" as any,
      phone: "+34910000001",
    },
  })

  const staff2 = await prisma.user.upsert({
    where: { id: "staff-002" },
    update: {},
    create: {
      id: "staff-002",
      name: "Diego Martinez",
      email: "diego.martinez@sentirextranjero.com",
      role: "staff" as any,
      phone: "+34910000002",
    },
  })

  const clientEntries = [
    {
      id: "client-001",
      name: "Ana Garcia",
      email: "ana.garcia@email.com",
      country: "Venezuela",
      phone: "+3460000001",
      notes: "Prioridad alta. Seguimiento semanal.",
      assigned: staff1.id,
      caseCount: 1,
    },
    {
      id: "client-002",
      name: "Carlos Ramirez",
      email: "carlos.ramirez@email.com",
      country: "Mexico",
      phone: "+3460000002",
      notes: "Prefiere WhatsApp.",
      assigned: staff1.id,
      caseCount: 0,
    },
    {
      id: "client-003",
      name: "Fatima Ali",
      email: "fatima.ali@email.com",
      country: "Marruecos",
      phone: "+3460000003",
      notes: "Necesita asistencia en arabe durante entrevistas.",
      assigned: staff2.id,
      caseCount: 0,
    },
    {
      id: "client-004",
      name: "Valentina Gomez",
      email: "valentina.gomez@email.com",
      country: "Colombia",
      phone: "+3460000004",
      notes: "Proyecto emprendedor en coordinacion con partners.",
      assigned: staff2.id,
      caseCount: 0,
    },
  ]

  for (const entry of clientEntries) {
    await prisma.user.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        name: entry.name,
        email: entry.email,
        role: "client" as any,
        phone: entry.phone,
        countryOfOrigin: entry.country,
      },
    })

    await prisma.client.upsert({
      where: { userId: entry.id },
      update: {
        caseCount: entry.caseCount,
        assignedStaffId: entry.assigned,
        notes: entry.notes,
      },
      create: {
        userId: entry.id,
        assignedStaffId: entry.assigned,
        caseCount: entry.caseCount,
        notes: entry.notes,
      },
    })
  }

  const sampleCase = await prisma.case.upsert({
    where: { caseNumber: "RES-2024-001" },
    update: {},
    create: {
      caseNumber: "RES-2024-001",
      clientId: "client-001",
      assignedStaffId: staff1.id,
      caseType: "family" as any,
      status: "in_progress" as any,
      priority: "high" as any,
      title: "Tarjeta comunitaria Ana",
      description: "Residencia familiar de ciudadano UE.",
      filingDate: new Date("2024-01-15"),
      deadlineDate: new Date("2024-06-15"),
      progressPercentage: 65,
    },
  })

  await prisma.client.update({
    where: { userId: "client-001" },
    data: { caseCount: 1 },
  })

  const milestones = [
    "Revision documental",
    "Cita en extranjeria",
    "Resolucion",
    "Toma de huellas y entrega",
  ]

  for (const [index, title] of milestones.entries()) {
    await prisma.caseMilestone.create({
      data: {
        caseId: sampleCase.id,
        title,
        orderIndex: index + 1,
        completed: index < 2,
      },
    })
  }

  await prisma.document.create({
    data: {
      caseId: sampleCase.id,
      uploaderId: "client-001",
      name: "Certificado de matrimonio",
      description: "Documento proporcionado por la pareja.",
      fileUrl: "/documents/marriage-cert.pdf",
      status: "approved" as any,
      isRequired: true,
      category: "Personal",
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



