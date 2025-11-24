import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock3, Shield, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tu agencia"
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contacto@example.com"

const proofPoints = [
  { label: "+45% productividad", desc: "Equipos que automatizan recordatorios y documentos" },
  { label: "100% aislado", desc: "Organizaciones separadas, sin cruces de datos" },
  { label: "-7 dias promedio", desc: "En la firma y entrega de documentos requeridos" },
]

const valueProps = [
  {
    title: "Casos sin friccion",
    desc: "Timeline unico con hitos, fechas clave, documentos y mensajes en un solo lugar.",
    icon: Sparkles,
  },
  {
    title: "Automatiza el seguimiento",
    desc: "Recordatorios por correo y calendar, con flujos que evitan atrasos y silencios.",
    icon: CheckCircle2,
  },
  {
    title: "Multi-agencia listo",
    desc: "Cada organizacion con dominio, branding y usuarios propios. Operacion centralizada, datos segregados.",
    icon: Users,
  },
  {
    title: "Archivo y firma controlada",
    desc: "Uploads directos a tu storage, URLs firmadas y estados claros (pendiente, revision, aprobado).",
    icon: Shield,
  },
]

const steps = [
  {
    title: "Captura y alta",
    items: ["Onboarding guiado", "Asignacion automatica de staff", "Caso creado con plantillas y fechas"],
  },
  {
    title: "Ejecucion y control",
    items: ["Documentos requeridos por caso", "Mensajes centralizados", "Alertas de vencimientos y agenda"],
  },
  {
    title: "Entrega y satisfaccion",
    items: ["Clientes con portal propio", "Reportes ejecutivos en tiempo real", "Auditoria completa por organizacion"],
  },
]

const differentiators = [
  "Portal unificado para staff y clientes",
  "Emails y notificaciones con tu marca",
  "Cron seguro para recordatorios y automatizaciones",
  "Integracion nativa con Supabase Storage y Resend",
  "Analiticas por organizacion: casos, documentos, tiempos",
  "Soporte multi-idioma listo para expansion",
]

const ctaLinks = [
  { label: "Hablar con un experto", href: `mailto:${SUPPORT_EMAIL}` },
  { label: "Ingresar al portal", href: "/login" },
]

const livePreview = [
  { label: "Checklist digital", value: "92%", hint: "Documentos firmados y auditables" },
  { label: "Alertas resueltas", value: "0 rojas", hint: "Recordatorios auto reenviados" },
  { label: "Casos activos", value: "48", hint: "Staff y cliente en el mismo hilo" },
]

const momentum = [
  "Go-live con playbook de 10 dias",
  "Integraciones listas (Supabase, Resend)",
  "Staff y clientes en un solo portal",
]

export default function SuperLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#030814] via-[#0a1f34] to-[#0bd0d8] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-10 top-24 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute right-10 top-10 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(12,208,217,0.08),transparent_25%),radial-gradient(circle_at_10%_70%,rgba(12,208,217,0.05),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:140px_140px] opacity-10" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-10 lg:pt-14">
        <header className="flex items-center justify-between">
          <Logo className="w-40" priority />
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Button asChild size="lg" className="group bg-white text-foreground shadow-lg shadow-cyan-500/30 hover:bg-white/90">
              <Link href="/login">
                Ingresar al portal
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="mt-10 grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-emerald-200/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 shadow-lg shadow-emerald-500/10">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                Hecho para agencias
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 backdrop-blur">
                {APP_NAME} | Portales multi-organizacion
              </span>
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl drop-shadow-xl">
              Portal premium para extranjeria. Control total del expediente, con la experiencia que tu marca merece.
            </h1>
            <p className="text-lg text-white/90 drop-shadow">
              Disena experiencias claras para tu cliente, automatiza recordatorios y asegura cumplimiento. Cada organizacion
              opera con su branding, mientras tu controlas infraestructura, metricas y seguridad.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="group bg-white text-foreground shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 hover:bg-white/90"
              >
                <Link href={ctaLinks[0].href}>
                  {ctaLinks[0].label}
                  <Sparkles className="ml-2 h-4 w-4 text-cyan-500 transition group-hover:rotate-6" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group border-white/60 bg-white/10 text-white shadow-lg shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:border-white hover:bg-white/15"
              >
                <Link href={ctaLinks[1].href}>
                  {ctaLinks[1].label}
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 backdrop-blur">
                <Shield className="h-4 w-4 text-emerald-300" />
                <span>Infra segura con organizaciones aisladas</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {proofPoints.map((item) => (
                <Card
                  key={item.label}
                  className="group relative overflow-hidden border-white/25 bg-gradient-to-br from-[#0d243d] via-[#0f3252] to-[#0aa7b4] px-4 py-4 shadow-lg shadow-cyan-500/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20"
                >
                  <div className="absolute inset-0 bg-white/0 opacity-0 transition duration-500 group-hover:opacity-10" />
                  <p className="text-lg font-semibold text-white drop-shadow-lg">{item.label}</p>
                  <p className="text-sm text-white/90">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden border-white/15 bg-[#0f1f35]/80 p-8 shadow-2xl shadow-cyan-500/20 backdrop-blur">
            <div className="pointer-events-none absolute -left-10 top-0 h-56 w-56 rounded-full bg-emerald-300/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-6 bottom-0 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
                Cobertura end-to-end
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-emerald-100">Live</span>
            </div>

            <div className="mt-6 space-y-4">
              {livePreview.map((item) => (
                <div
                  key={item.label}
                  className="group rounded-xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:border-emerald-200/40 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">{item.label}</p>
                    <ArrowRight className="h-4 w-4 text-white/50 transition group-hover:translate-x-1" />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-2xl font-semibold text-white">{item.value}</p>
                    <span className="text-xs text-emerald-200">{item.hint}</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-white shadow-lg shadow-emerald-500/30 transition-all duration-700 group-hover:w-[95%]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {valueProps.map(({ title, desc, icon: Icon }) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200/40"
                >
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{title}</p>
                    <p className="text-sm text-white/75">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-4 text-sm text-white shadow-lg shadow-emerald-500/20 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-emerald-100" />
                <span>Playbook guiado para lanzar en 10 dias.</span>
              </div>
              <Button asChild size="sm" className="bg-white text-foreground hover:bg-white/90">
                <Link href={ctaLinks[1].href}>Ver demo</Link>
              </Button>
            </div>
          </Card>
        </main>

        <section className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-300/15 blur-2xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-28 w-28 rounded-full bg-cyan-400/15 blur-2xl" />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Impulso inmediato</p>
            <div className="flex flex-wrap gap-2 text-xs text-white/80">
              {momentum.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 shadow-md shadow-cyan-500/10 transition hover:-translate-y-0.5"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mt-14 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Metodologia en 3 pasos</p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-200/40 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-white/80">0{idx + 1}</p>
                  <ArrowRight className="h-5 w-5 text-white/70 transition group-hover:translate-x-1" />
                </div>
                <p className="mt-3 text-lg font-semibold">{step.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {step.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-white/15 bg-[#0f1f35]/80 p-8 shadow-2xl shadow-cyan-500/20 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Por que te eligen</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Multi-organizacion seguro, branding por agencia.</h2>
            <p className="mt-2 text-white/80">
              Cada organizacion vive en su propio espacio: dominios, logo, colores, usuarios y casos. El panel de
              administracion central te da visibilidad sin mezclar datos. Perfecto para franquicias, partners o equipos
              en varios paises.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {differentiators.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/10 p-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-300" />
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-white text-foreground hover:bg-white/90 shadow-lg shadow-cyan-500/25">
                <Link href="/login">Probar portal</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/15">
                <Link href={`mailto:${SUPPORT_EMAIL}`}>Agendar demo</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-white/15 bg-[#0b1f34]/85 p-0 shadow-2xl shadow-cyan-500/15 backdrop-blur">
            <div className="bg-gradient-to-r from-white/15 to-white/0 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Panel operativo</p>
              <p className="text-base text-white/80">Lo que ve tu staff al iniciar sesion</p>
            </div>
            <div className="space-y-0 border-t border-white/10">
              {[
                { label: "Casos activos", value: "132", change: "+18% mes" },
                { label: "Documentos aprobados", value: "487", change: "+32% este trimestre" },
                { label: "Recordatorios enviados", value: "1,240", change: "0 errores" },
              ].map((stat) => (
                <div key={stat.label} className="grid grid-cols-[1fr,auto] items-center px-6 py-4 hover:bg-white/5">
                  <div>
                    <p className="text-sm text-white/70">{stat.label}</p>
                    <p className="text-xl font-semibold text-white">{stat.value}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-100">{stat.change}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-12 rounded-3xl border border-white/15 bg-[#0f2339]/85 p-8 shadow-2xl shadow-cyan-500/20 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">CTA final</p>
              <h3 className="text-3xl font-semibold">Lanza tu portal de extranjeria premium en dias, no meses.</h3>
              <p className="mt-2 text-white/80">Sin humo: onboarding asistido, seeds de datos y checklist de seguridad.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90 shadow-lg shadow-cyan-500/25">
                <Link href="/login">Ir al portal</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/15">
                <Link href={`mailto:${SUPPORT_EMAIL}`}>Solicitar demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
