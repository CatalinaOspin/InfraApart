-- ============================================================
-- InfraApart :: Suplemento SQL para Supabase (posterior a prisma db push)
-- Revisión: 2026-09-14 · Postgres 15 / PostGIS 3.3 · Prisma 6
--
-- POR QUÉ EXISTE ESTE ARCHIVO:
-- `prisma db push` crea tablas, enums, FKs e índices convencionales,
-- pero NO puede crear:
--   1) La extensión PostGIS
--   2) Índices GIST sobre expresiones (ST_MakePoint)
--   3) Funciones / triggers (updated_at automático)
--   4) Datos iniciales (seeds)
--
-- SECUENCIA RECOMENDADA en un proyecto Supabase:
--   1. cd backend && npm run prisma:push      (crea tablas y enums en la nube)
--   2. cd backend && npm run prisma:postgis   (ESTE script; idempotente)
--      Alternativas: Supabase → Dashboard → SQL Editor, o
--      psql "$DIRECT_URL" -f prisma/postgis-supabase.sql
--   3. npm run db:test                        (handshake + consultas + seeds)
--
-- NOTA SUPABASE: PostGIS se instala en el schema `postgis` (no en public).
-- Este script ajusta el search_path del rol para resolver ST_MakePoint y
-- tipos geography SIN calificar. NO elimina ni reubica la extensión.
--
-- Referencia de la fuente de verdad: docs/database_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) Extensiones + search_path
-- ------------------------------------------------------------
-- PostGIS en Supabase se instala en el schema `postgis`. Añadimos ese
-- schema al search_path de forma PERSISTENTE (nuevas sesiones) y para la
-- sesión actual, de modo que ST_MakePoint, ST_SetSRID y el tipo geography
-- resuelvan sin calificar. Idempotente.
ALTER ROLE postgres SET search_path TO "$user", public, extensions, postgis;
SET search_path TO "$user", public, extensions, postgis;

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA postgis;

-- ------------------------------------------------------------
-- 2) Índice espacial (expresión GIST) que Prisma no puede generar.
--    latitude/longitude son columnas ordinarias (DOUBLE PRECISION);
--    el índice GIST sobre ST_MakePoint conserva la búsqueda espacial
--    nativa (ST_DWithin / ST_Distance) sin columnas Unsupported.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reports_location
    ON reports USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- ------------------------------------------------------------
-- 3) Trigers de updated_at (las tablas ya existen por prisma db push)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_report_statuses_updated_at ON report_statuses;
CREATE TRIGGER trg_report_statuses_updated_at
    BEFORE UPDATE ON report_statuses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 4) Datos iniciales (seeds) — idempotentes
-- ------------------------------------------------------------
INSERT INTO categories (name, description, icon) VALUES
    ('pothole',   'Hueco o bache en la vía',            '🕳️'),
    ('crack',     'Grieta o fisura en el pavimento',    '〰️'),
    ('flooding',  'Acumulación de agua o inundación',   '🌊'),
    ('sidewalk',  'Acera en mal estado',                '🛤️'),
    ('signage',   'Señalización dañada o ausente',      '⚠️'),
    ('lighting',  'Alumbrado público averiado',         '💡'),
    ('drainage',  'Drenaje obstruido o dañado',         '🌀'),
    ('other',     'Otro tipo de daño',                  '🔧')
ON CONFLICT (name) DO NOTHING;

INSERT INTO report_statuses (name, label, color, description, order_index) VALUES
    ('pending',     'Pendiente',   '#FFC107', 'Reporte recibido, pendiente de revisión',  10),
    ('in_review',   'En revisión', '#2196F3', 'Siendo evaluado por el equipo',            20),
    ('in_progress', 'En proceso',  '#FF9800', 'Trabajo en curso para resolverlo',         30),
    ('resolved',    'Resuelto',    '#4CAF50', 'Daño atendido y resuelto',                 40),
    ('rejected',    'Rechazado',   '#F44336', 'Reporte descartado por el equipo',         50)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------
-- 5) Verificación
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'La extensión PostGIS no está disponible';
  END IF;
END $$;