-- Insert default case type templates
INSERT INTO case_type_templates (id, name, description, documents, states, timeframe, base_case_type) VALUES
(''residencia-familiares-ue'',
 ''Residencia de familiares de ciudadanos UE'',
 ''Tramite comunitario para conyuges y familiares de ciudadanos espanoles o de la UE.'',
 ''["Pasaporte vigente","Certificado de matrimonio o vinculo familiar legalizado","Certificado de empadronamiento conjunto","Medios economicos del ciudadano europeo"]''::jsonb,
 ''["Revision documental","Cita en extranjeria","Resolucion","Toma de huellas y entrega"]''::jsonb,
 ''Entre 3 y 4 meses en Madrid (puede variar segun provincia).'',
 ''family'')
ON CONFLICT (id) DO NOTHING;

-- Insert demo admin user
INSERT INTO users (id, email, name, role, phone, created_at) VALUES
(''admin-001'', ''admin@sentirextranjero.com'', ''Coordinacion Sentir'', ''admin'', ''+34910000000'', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo staff users
INSERT INTO users (id, email, name, role, phone, created_at) VALUES
(''staff-001'', ''laura.garcia@sentirextranjero.com'', ''Laura Garcia'', ''staff'', ''+34910000001'', NOW()),
(''staff-002'', ''diego.martinez@sentirextranjero.com'', ''Diego Martinez'', ''staff'', ''+34910000002'', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo client users
INSERT INTO users (id, email, name, role, phone, country_of_origin, created_at) VALUES
(''client-001'', ''ana.garcia@email.com'', ''Ana Garcia'', ''client'', ''+3460000001'', ''Venezuela'', NOW()),
(''client-002'', ''carlos.ramirez@email.com'', ''Carlos Ramirez'', ''client'', ''+3460000002'', ''Mexico'', NOW()),
(''client-003'', ''fatima.ali@email.com'', ''Fatima Ali'', ''client'', ''+3460000003'', ''Marruecos'', NOW()),
(''client-004'', ''valentina.gomez@email.com'', ''Valentina Gomez'', ''client'', ''+3460000004'', ''Colombia'', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert client records
INSERT INTO clients (user_id, assigned_staff_id, case_count, notes) VALUES
(''client-001'', ''staff-001'', 1, ''Residencia comunitaria en seguimiento semanal''),
(''client-002'', ''staff-001'', 2, ''Prefiere actualizaciones por WhatsApp''),
(''client-003'', ''staff-002'', 1, ''Asistencia en arabe durante entrevistas''),
(''client-004'', ''staff-002'', 1, ''Proyecto emprendedor coordinado con partners'')
ON CONFLICT (user_id) DO NOTHING;

-- Insert demo cases
INSERT INTO cases (case_number, client_id, assigned_staff_id, case_type, status, priority, title, description, filing_date, deadline_date, progress_percentage) VALUES
(''RES-2024-001'', ''client-001'', ''staff-001'', ''family'', ''in_progress'', ''high'', ''Residencia familiar de ciudadano UE'', ''Tarjeta comunitaria para conyuge de ciudadano espanol'', ''2024-01-15'', ''2024-06-15'', 65),
(''ARR-2024-002'', ''client-002'', ''staff-001'', ''employment'', ''under_review'', ''medium'', ''Arraigo laboral'', ''Regularizacion por arraigo laboral con contrato indefinido'', ''2024-02-01'', ''2024-08-01'', 80),
(''NAC-2024-003'', ''client-002'', ''staff-001'', ''citizenship'', ''in_progress'', ''medium'', ''Nacionalidad por residencia'', ''Expediente telematico ante Ministerio de Justicia'', ''2024-03-10'', ''2024-12-10'', 45),
(''ASY-2024-004'', ''client-003'', ''staff-002'', ''asylum'', ''pending'', ''urgent'', ''Solicitud de proteccion internacional'', ''Seguimiento de entrevistas y resolucion'', ''2024-03-20'', ''2024-09-20'', 30),
(''INV-2024-005'', ''client-004'', ''staff-002'', ''employment'', ''in_progress'', ''high'', ''Residencia para emprendedores'', ''Plan de negocio para residencia por emprendimiento'', ''2024-04-01'', ''2024-10-01'', 50);

-- Insert case milestones
INSERT INTO case_milestones (case_id, title, description, due_date, completed, order_index) VALUES
(1, ''Entrega de documentacion'', ''Recopilar certificados y empadronamiento'', ''2024-01-15'', TRUE, 1),
(1, ''Cita en extranjeria'', ''Presentacion en oficina de extranjeria de Madrid'', ''2024-02-10'', TRUE, 2),
(1, ''Resolucion'', ''Esperar resolucion oficial'', ''2024-05-01'', FALSE, 3),
(1, ''Expedicion de tarjeta'', ''Cita para huellas y recogida'', ''2024-06-15'', FALSE, 4);

INSERT INTO case_milestones (case_id, title, description, due_date, completed, order_index) VALUES
(2, ''Informe laboral'', ''Validar contrato y vida laboral'', ''2024-02-01'', TRUE, 1),
(2, ''Arraigo social'', ''Entrega de informes comunitarios'', ''2024-03-05'', TRUE, 2),
(2, ''Resolucion'', ''Resolucion de Delegacion del Gobierno'', ''2024-07-15'', FALSE, 3),
(2, ''Alta en Seguridad Social'', ''Registro en Seguridad Social tras aprobacion'', ''2024-08-01'', FALSE, 4);

-- Insert demo documents
INSERT INTO documents (case_id, uploaded_by, name, description, file_url, status, is_required, category) VALUES
(1, ''client-001'', ''Libro de familia'', ''Copias compulsadas'', ''/documents/libro-familia.pdf'', ''approved'', TRUE, ''Personal''),
(1, ''client-001'', ''Certificado de empadronamiento'', ''Reciente, con menos de 3 meses'', ''/documents/empadronamiento.pdf'', ''approved'', TRUE, ''Personal''),
(1, ''client-001'', ''Pasaporte'', ''Pasaporte vigente'', ''/documents/pasaporte.pdf'', ''submitted'', TRUE, ''Identification''),
(2, ''client-002'', ''Contrato laboral'', ''Contrato indefinido registrado'', ''/documents/contrato.pdf'', ''approved'', TRUE, ''Employment''),
(2, ''client-002'', ''Vida laboral'', ''Informe completo TGSS'', ''/documents/vida-laboral.pdf'', ''approved'', TRUE, ''Employment''),
(3, ''client-002'', ''Certificado de antecedentes'', ''Antecedentes penales apostillados'', ''/documents/antecedentes.pdf'', ''pending'', TRUE, ''Legal'');

-- Insert demo messages
INSERT INTO messages (case_id, sender_id, receiver_id, subject, content, status) VALUES
(1, ''staff-001'', ''client-001'', ''Actualizacion residencia comunitaria'', ''Hemos entregado toda la documentacion y esperamos resolucion en 6 semanas.'', ''read''),
(1, ''client-001'', ''staff-001'', ''Duda sobre huellas'', ''Cuando se solicita la cita para huellas una vez aprobada la tarjeta?'', ''read''),
(2, ''staff-001'', ''client-002'', ''Arraigo laboral'', ''Tu expediente esta en fase de resolucion, te avisaremos al recibir notificacion.'', ''delivered'');

-- Insert demo notifications
INSERT INTO notifications (user_id, title, message, type, related_case_id, is_read) VALUES
(''client-001'', ''Documento aprobado'', ''Tu certificado de empadronamiento fue validado'', ''document'', 1, TRUE),
(''client-001'', ''Cambio de estado'', ''Tu caso paso a fase de resolucion'', ''case'', 1, FALSE),
(''client-002'', ''Nuevo mensaje'', ''Tienes un mensaje del equipo legal'', ''message'', 2, FALSE),
(''staff-001'', ''Cita proxima'', ''La resolucion del casos RES-2024-001 vence pronto'', ''deadline'', 1, FALSE);

-- Insert activity logs
INSERT INTO activity_logs (user_id, case_id, action, description) VALUES
(''staff-001'', 1, ''case_created'', ''Apertura de caso RES-2024-001''),
(''client-001'', 1, ''document_uploaded'', ''Subio certificado de empadronamiento''),
(''staff-001'', 1, ''document_approved'', ''Validacion de documentacion comunitaria''),
(''staff-001'', 1, ''case_updated'', ''Cambio de estado a In Progress''),
(''client-002'', 2, ''document_uploaded'', ''Subio contrato laboral firmado'');
