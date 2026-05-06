-- ============================================================
-- Tabla leads — captación de consultas sobre propiedades
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- ============================================================

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  nombre text,
  email text not null,
  mensaje text,
  propiedad_id text,
  propiedad_titulo text,
  created_at timestamp with time zone default now()
);

-- Índice para consultas por email
create index if not exists leads_email_idx on leads (email);

-- Índice para filtrar por propiedad
create index if not exists leads_propiedad_id_idx on leads (propiedad_id);

-- Row Level Security — solo lectura desde el service role
alter table leads enable row level security;

-- Política: cualquier usuario anónimo puede insertar (formulario de contacto)
create policy "Insertar leads anónimamente"
  on leads for insert
  to anon
  with check (true);

-- Política: solo autenticados pueden leer leads (futuro admin)
create policy "Leer leads autenticados"
  on leads for select
  to authenticated
  using (true);
