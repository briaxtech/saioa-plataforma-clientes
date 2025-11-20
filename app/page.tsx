import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu plataforma"
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contacto@example.com"

const features = [
  {
    title: "Casos centralizados",
    description: "Toda la información del expediente en una sola vista: hitos, documentos y comunicaciones.",
  },
  {
    title: "Automatización",
    description: "Recordatorios inteligentes para el equipo y los clientes, con avisos por correo y calendar.",
  },
  {
    title: "Multi-agencia",
    description: "Cada organización opera aislada, con branding propio y control total de sus clientes.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#031247] via-[#071f47] to-[#0d2b66] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:py-10">
        <Logo className="w-40" priority />
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/login" className="hidden rounded-full px-4 py-2 transition hover:bg-white/10 sm:block">
            Ingresar al portal
          </Link>
          <Button asChild size="lg" className="bg-white text-[#031247] hover:bg-white/90">
            <Link href="/login">Ir al panel</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-16">
        <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.6em] text-white/70">{APP_NAME}</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Plataforma para agencias de migración que acompañan cada etapa del expediente.
            </h1>
            <p className="text-lg text-white/80">
              Gestiona clientes, trámites y documentación en un solo espacio. Multiplica tu operación creando espacios por
              agencia y ofrece una experiencia premium a tu equipo y clientes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-[#031247] hover:bg-white/90">
                <Link href="/login">Entrar al portal</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                <Link href={`mailto:${SUPPORT_EMAIL}`}>Tener una demo</Link>
              </Button>
            </div>
          </div>
          <Card className="border-white/20 bg-white/10 px-6 py-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Cómo te ayudamos</p>
            <ul className="mt-6 space-y-6 text-white/90">
              {features.map((feature) => (
                <li key={feature.title}>
                  <p className="text-lg font-semibold">{feature.title}</p>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </main>
    </div>
  )
}
