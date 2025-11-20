import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const defaultPasswordHash = await bcrypt.hash("demo123", 10)

  // Reset tables so the demo always reflects a single canonical client case
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.document.deleteMany()
  await prisma.caseMilestone.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.case.deleteMany()
  await prisma.client.deleteMany()
  await prisma.caseTypeTemplate.deleteMany()
  await prisma.user.deleteMany()

  const organization = await prisma.organization.create({
    data: {
      id: "org-sentir",
      name: "Sentir Extranjero",
      slug: "sentir",
      domain: "sentir.local",
      supportEmail: "coordinacion@sentirextranjero.com",
    },
  })

  await prisma.caseTypeTemplate.create({
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
      states: ["Revision documental", "Cita en extranjeria", "Resolucion", "Toma de huellas y entrega"],
      timeframe: "Entre 3 y 4 meses en Madrid (puede variar segun provincia).",
      baseCaseType: "family",
    },
  })

  await prisma.user.create({
    data: {
      id: "admin-001",
      organizationId: organization.id,
      name: "Coordinacion Demo",
      email: "admin@demo.com",
      role: "admin",
      phone: "+34 910 000 000",
      passwordHash: defaultPasswordHash,
    },
  })

  await prisma.user.createMany({
    data: [
      {
        id: "staff-001",
        organizationId: organization.id,
        name: "Laura Garcia",
        email: "laura.garcia@sentirextranjero.com",
        role: "staff",
        phone: "+34 910 000 001",
        passwordHash: defaultPasswordHash,
      },
      {
        id: "staff-002",
        organizationId: organization.id,
        name: "Diego Martinez",
        email: "diego.martinez@sentirextranjero.com",
        role: "staff",
        phone: "+34 910 000 002",
        passwordHash: defaultPasswordHash,
      },
    ],
  })

  // No clients/cases/documents/messages are seeded so you can create them manually from the app
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
