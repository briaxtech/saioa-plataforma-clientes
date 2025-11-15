# Sentir Extranjero - Portal de extranjeria y nacionalidad

Plataforma full-stack basada en Next.js 16 para que el equipo de Sentir Extranjero gestione expedientes, documentos y comunicaciones de clientes que tramitan su residencia o nacionalidad en Espana.

## Caracteristicas principales

### Espacio para el equipo
- **Panel unificado** con resumen de casos activos, documentos pendientes y actividad reciente.
- **Gestion de expedientes** con progreso, hitos y prioridades.
- **Directorio de clientes** con notas internas y asignacion de responsables.
- **Revision documental** para aprobar, rechazar o solicitar cambios directamente desde la app.
- **Bitacora y alertas** que registran cada accion y anticipan vencimientos.

### Portal de clientes
- **Seguimiento en tiempo real** del estado del tramite y su cronologia.
- **Carga de documentos** segura y guiada por categoria.
- **Mensajeria directa** con el equipo de Sentir Extranjero.
- **Recordatorios proactivos** sobre hitos y tareas pendientes.

### Base tecnica
- Next.js 16 (App Router) + React 19
- Neon PostgreSQL como base de datos principal
- Autenticacion basada en cookies y contexto propio
- SWR para consultas reactivas
- Tailwind CSS 4 con sistema de diseno personalizado inspirado en sentirextranjero.com

## Puesta en marcha

1. **Instalar dependencias**
   ```bash
   npm install
   ```
2. **Migrar base de datos (Neon conectada)**
   - `scripts/01-create-tables.sql`
   - `scripts/02-seed-data.sql`
3. **Variables de entorno**
   - `DATABASE_URL`, `POSTGRES_URL` (preconfiguradas)
   - Opcionales para Google Drive: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`
4. **Iniciar entorno local**
   ```bash
   npm run dev
   ```

## Credenciales de demostracion

### Equipo / Administracion
- **Email**: `admin@sentirextranjero.com`
- **Password**: `demo123`

### Clientes
- `ana.garcia@email.com`
- `carlos.ramirez@email.com`
- `fatima.ali@email.com`
- `valentina.gomez@email.com`

Todas las cuentas de clientes usan `demo123` como password por defecto.

## Esquema principal

- `users`, `clients`, `cases`, `case_milestones`, `documents`, `messages`, `notifications`, `activity_logs`
- Enums para `case_status`, `case_type`, `priority_level`, `document_status`, `user_role`

## Endpoints destacados

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/cases`, `GET /api/cases/[id]`, `POST /api/cases`, `PATCH /api/cases/[id]`
- `GET /api/clients`, `GET /api/clients/[id]`
- `GET /api/documents`, `POST /api/documents`, `PATCH /api/documents/[id]`
- `GET /api/messages`, `POST /api/messages`, `PATCH /api/messages/[id]`
- `GET /api/notifications`, `POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`
- `GET /api/stats`, `GET /api/activity`

La estructura y los componentes UI ahora replican la estetica, colores y activos de sentirextranjero.com, facilitando una transicion transparente para el cliente.
