-- ============================================================
-- InfraApart :: Suplemento SQL Local / Producción (posterior a prisma db push)
-- Revisión: 2026-09-25 · Postgres 15 / PostGIS 3.3 · Prisma 6
--
-- POR QUÉ EXISTE ESTE ARCHIVO:
-- `prisma db push` crea tablas, enums, FKs e índices convencionales,
-- pero no crea automáticamente:
--   1) La extensión PostGIS (si está disponible en el entorno)
--   2) Índices GIST sobre expresiones (ST_MakePoint)
--   3) Funciones / triggers (updated_at automático)
--   4) Datos iniciales (seeds de categorías y estados)
--
-- SECUENCIA RECOMENDADA:
--   1. cd backend && npm run prisma:push
--   2. cd backend && npm run prisma:postgis   (ESTE script; 100% idempotente)
--   3. npm run db:test                        (handshake + consultas + seeds)
-- ============================================================

-- ------------------------------------------------------------
-- 1) Extensiones + search_path
-- ------------------------------------------------------------
DO $$
BEGIN
  -- Intenta habilitar PostGIS en el schema public o postgis si existe
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA postgis;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS no está disponible en este entorno de PostgreSQL. Continuando con tablas y seeds.';
  END;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'postgis') THEN
    ALTER ROLE postgres SET search_path TO "$user", public, extensions, postgis;
    SET search_path TO "$user", public, extensions, postgis;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) Índice espacial (expresión GIST) si PostGIS está habilitado
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3) Triggers de updated_at (las tablas ya existen por prisma db push)
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
