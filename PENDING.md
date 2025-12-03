# Pending list (estado al viernes)

## Estado rapido
- Build: `npm run build` pasa.
- Lint: pasa (warnings resueltos).
- Avance hoy: bucket Supabase se crea privado y se sirven URLs firmadas; login exige slug y el formulario pide espacio; secretos alineados (`NEXTAUTH_SECRET` con fallback `AUTH_SECRET` y documentado); credenciales demo ocultas en produccion por defecto; rate limiting basico; usuarios admin/staff con contraseña temporal; lint limpio.

## Bloqueantes para lanzar (seguridad / datos)
- [hecho] Storage privado + URLs firmadas (`lib/storage.ts`, `app/api/documents/route.ts`).
- [hecho] Login multi-tenant exige slug y UI pide espacio (`lib/auth.ts`, `components/login-view.tsx`).
- [hecho] Secretos alineados (`NEXTAUTH_SECRET` fallback `AUTH_SECRET`, `.env.example`).
- [hecho] Superadmin token via cookie HttpOnly+Secure; cliente deja de persistir en localStorage (`app/api/superadmin/route.ts`, `lib/superadmin-client.ts`, `app/superadmin/login/page.tsx`).
- [hecho] Rate limiting in-memory en login, uploads, mensajes y AI review (faltaria endurecer si hay mas trafico).
- [hecho] Usuarios admin/staff ahora se crean con contraseña (temporal generada si no se envia) y se devuelve `temporary_password` (`app/api/admin/users/route.ts`).
- [pendiente] Cron endpoints (`/api/cron/*`) dependen de `CRON_SECRET_KEY`; validar en prod y no exponer URLs. Tiempo: 0.25 d.
- [pendiente] Demo: seed borra datos; definir estrategia en prod (ahora bloquea si `ALLOW_PROD_SEED` != true). Tiempo: 0.25 d.
- [pendiente] Emails/privacidad: revisar copy con caracteres mal codificados en landing y mensajes de API antes de produccion.

## Calidad / deuda rapida
- Types/CI: agregar `tsc --noEmit` al pipeline y revisar warnings. Ajustar `tsconfig.json` ya modificado por Next.
- Observabilidad: no hay Sentry/monitoring ni health checks de cron; configurar antes de produccion.
- Antimalware para uploads: hoy solo tamaño/mime; evaluar escaneo o sandbox si hay tiempo.

## Stripe (preparacion)
- Esquema: añadir campos en `organizations` (`stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `period_end`, `trial_end`, `seats`) y tabla `webhook_events` para idempotencia.
- Endpoints: `/api/stripe/webhook` con validacion de firma y lockers idempotentes; endpoints de checkout/portal (customer portal).
- Logica de negocio: bloquear features/limites por plan (casos activos, uploads/mes, usuarios); mostrar estado en Admin > Configuracion.
- UI: pantalla de planes, boton “Actualizar plan”, y portal de facturacion.
- Tiempo estimado Stripe base: 2-3 d (sin prorrateos avanzados).

## Plan sugerido (orden y estimacion)
1) Seguridad residual: validar cron key en despliegue y definir estrategia demo/prod (0.5 d).
2) Observabilidad (Sentry/logs, health cron) (0.5 d).
3) Stripe preparacion inicial (migraciones + webhook + checkout basico) (2-3 d).
4) Ajustes finales UX/legales (Terminos/Privacidad, banner cookies ya existe) (0.5 d).

## Variables/env a verificar
- `NEXTAUTH_SECRET` / `AUTH_SECRET`, `CRON_SECRET_KEY`
- `DATABASE_URL`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (privado)
- `SUPABASE_SIGNED_URL_TTL` (segundos)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` (mostrar/ocultar credenciales demo en UI)
- `ALLOW_PROD_SEED` (controla ejecucion de seed en prod)
- (Stripe) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` cuando se integre

## Notas adicionales
- `prisma/seed.ts` borra datos; no ejecutar en prod.
- Build Turbopack muestra aviso de `baseline-browser-mapping` desactualizado; opcional actualizar devDependency.
- Token superadmin: considerar expiracion corta y CSRF/token-binding cuando se endurezca.

## Integraciones futuras (no urgente)
- Importar clientes desde CRM (HubSpot/Salesforce/Zoho) con sync inicial + incremental; definir scopes y flujo OAuth cuando se priorice.
- Se evita por ahora el conector directo con Google Sheets para no exigir configuracion OAuth; mantener la importacion por CSV/Excel ya disponible.
