# Codex Progress Log

## 2025-11-19
### Cambios recientes
- La API de analisis de documentos ahora descarga archivos via Supabase (storage_path o file_url), valida organization_id y eliminamos la dependencia de Google Drive.
- Se elimino el helper de Google Drive para evitar confusiones con el nuevo almacenamiento centralizado.
- Paneles de admin/cliente, login, landing, layout y logo toman el nombre de la organizacion/app desde contexto/env; los correos de bienvenida tambien usan dichas variables.

### Pendientes prioritarios
- Revisar el resto del frontend/backend por textos o logica acoplada a una sola marca (ej. notificaciones, plantillas de correo adicionales, assets).
- Ajustar la vista responsive solicitada (opciones como columna cerca del breakpoint mobile) y validar que no existan layouts rotos tras los cambios.
- Completar el checklist multi-tenant pendiente: flujos de subida/bajada de documentos desde cliente, configuracion de case templates por organizacion y pruebas end-to-end.
- Documentar en README y .env.example los nuevos requisitos de Supabase y Google Calendar antes del traspaso final.

## 2025-11-20
### Cambios recientes
- README y `.env.example` ahora describen la arquitectura multi-tenant, los requisitos de Supabase/Google Calendar/n8n y las credenciales demo genericas.
- Ajusté la paleta base en `globals.css` para remover referencias a la marca previa.
- El bloque de estado/fecha/responsable dentro de la linea de tiempo del caso ahora se apila en una sola columna antes de `lg`, evitando el quiebre visual reportado.
- La autenticación pasó a NextAuth (provider de credenciales), reemplazando el manejo manual de cookies y exponiendo `/api/auth/[...nextauth]`.

### Pendientes prioritarios
- Hacer un QA completo de los flujos de documentos (subida/descarga cliente y staff) apuntando al bucket centralizado de Supabase, incluyendo expiracion de URLs firmadas.
- Validar plantillas/historial multi-tenant (case templates, notificaciones automatizadas, mensajes predefinidos) y actualizar seeds si alguna plantilla debe vivir por organizacion.
- Reemplazar los assets (logo, favicon) por versiones neutrales o parametrizables y documentar el proceso de personalizacion por agencia.
- Correr un smoke test end-to-end (login admin, crear cliente/caso, subir documento, agendar fecha clave con recordatorio) antes del traspaso final.
