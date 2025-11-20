# Saioa Platform - Portal multi-tenant de casos y clientes

Plataforma construida con Next.js 16 y Prisma para que agencias y estudios gestionen sus expedientes en un entorno multi-tenant: cada organización mantiene su branding, usuarios y casos mientras la infraestructura (base de datos y storage) se administra centralmente.

## Caracteristicas principales

- **Espacios aislados**: usuarios, clientes, casos, plantillas y mensajes separados por `organization_id`.
- **Tableros para equipo y clientes**: panel administrativo para staff y portal de clientes para seguimiento, mensajes y documentos.
- **Documentos en Supabase Storage**: reemplaza carpetas de terceros; todos los archivos viven en un bucket controlado por la agencia y se sirven con URLs firmadas.
- **Fechas clave + recordatorios**: recordatorios por correo y sincronizacion opcional con Google Calendar mediante cuenta de servicio.
- **Autenticacion NextAuth**: sesiones JWT con provider de credenciales contra la base Postgres/Supabase, incluyendo datos de la organizacion activa.
- **Automatizaciones**: cron jobs protegidos por `CRON_SECRET_KEY` y webhook opcional hacia n8n para analisis de documentos o workflows extra.

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, SWR, Tailwind CSS 4, shadcn/ui.
- **Backend**: API Routes con Prisma + PostgreSQL (Neon/Supabase).
- **Autenticacion**: NextAuth (estrategia JWT + Credentials provider).
- **Storage**: Supabase buckets para uploads/descargas.
- **Emails / notificaciones**: Resend.
- **Automations**: Cron jobs + integraciones opcionales (n8n, Stack).

## Puesta en marcha

1. **Instalar dependencias**
   ```bash
   npm install
   ```
2. **Configurar variables**
   - Copia `.env.example` a `.env` y completa cada bloque (ver tabla **Variables clave**).
3. **Preparar base de datos**
   ```bash
   npx prisma migrate deploy
   npm run db:seed   # crea organizacion demo, usuarios y casos
   ```
4. **Iniciar entorno local**
   ```bash
   npm run dev
   ```

## Variables clave

| Grupo | Variables |
| ----- | --------- |
| **App / Auth** | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXTAUTH_URL`, `AUTH_SECRET` |
| **Database** | `DATABASE_URL` (Neon / Supabase Postgres) |
| **Supabase storage** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` |
| **Google Calendar (opcional)** | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` |
| **Automatizaciones** | `CRON_SECRET_KEY`, `N8N_DOCUMENT_REVIEW_WEBHOOK_URL` (o `N8N_WEBHOOK_URL`) |
| **Emails** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Integraciones opcionales** | `STACK_SECRET_SERVER_KEY` |

> `AUTH_SECRET` es obligatorio para firmar los JWT de NextAuth. `NEXTAUTH_URL` debe apuntar al dominio publico cuando se despliegue.

## Credenciales demo

- **Equipo / staff**
  - Email: `admin@demo.com`
  - Password: `demo123`
- **Clientes** (todos usan `demo123`): `ana.garcia@email.com`, `carlos.ramirez@email.com`, etc.

## Consideraciones multi-tenant

- Todas las rutas del backend validan `organization_id` antes de leer/escribir (`lib/db` + helpers en `lib/auth`).
- Los documentos se guardan en Supabase bajo la ruta `${organizationId}/cases/${caseId}/...` y se sirven con URLs firmadas temporales.
- Notificaciones, actividad, contactos, fechas clave y plantillas consultan siempre la organizacion activa para garantizar aislamiento.
- El branding por agencia se controla con `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL` y los assets/colores en `public/` y `app/globals.css`.

## Scripts utiles

- `npm run lint` – chequeo de calidad.
- `npm run db:seed` – regenera datos demo.
- `npm run build && npm run start` – build/productivo.

## Proximos pasos sugeridos

- Configurar dominios personalizados por tenant (middleware/rewrites).
- Extender plantillas y tarifas especificas por organizacion.
- Conectar cron jobs a tu scheduler preferido (Vercel Cron, Supabase Edge Functions, etc.).
