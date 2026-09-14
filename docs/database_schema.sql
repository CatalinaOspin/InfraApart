-- ============================================================
-- InfraApart :: Esquema de base de datos (PostgreSQL + PostGIS)
-- Revisión: 2026-09-14 · Postgres 15 / PostGIS 3.3 · Prisma 6
--
-- IMPORTANTE:
-- * Este script es la FUENTE DE VERDAD del modelo de datos.
--   docker-compose.yml lo monta en /docker-entrypoint-initdb.d/
--   y se ejecuta automáticamente SOLO al crear el volumen por primera vez.
-- * Para aplicar este esquema sobre un volumen existente:
--     docker compose down -v && docker compose up -d
-- * Después de inicializar, sincronizar Prisma con:
--     cd backend && npx prisma db pull && npx prisma generate
-- ============================================================

-- ------------------------------------------------------------
-- 1) Extensiones
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------
-- 2) Tipos ENUM (Prisma los introspecta como enums nativos)
-- ------------------------------------------------------------

-- Rol de usuario en la plataforma
DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de daño (vocabulario controlado del reporte)
DO $$
BEGIN
  CREATE TYPE damage_type AS ENUM (
    'pothole', 'crack', 'flooding', 'sidewalk',
    'signage', 'lighting', 'drainage', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Nivel de severidad del daño
DO $$
BEGIN
  CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 3) Función utilitaria para timestamps
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 4) Tabla: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role NOT NULL DEFAULT 'citizen',
    phone         VARCHAR(20),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Usuarios de la plataforma (ciudadanos y administradores)';

CREATE INDEX IF NOT EXISTS idx_users_email  ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 5) Tabla: categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Categorías de daños viales visibles para el ciudadano';

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories (is_active);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 6) Tabla: report_statuses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_statuses (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(30) NOT NULL UNIQUE,
    label       VARCHAR(80) NOT NULL,
    color       VARCHAR(20) NOT NULL DEFAULT '#CCCCCC',
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE report_statuses IS 'Flujo de estados de un reporte (pendiente → resuelto/rechazado)';

CREATE INDEX IF NOT EXISTS idx_report_statuses_active ON report_statuses (is_active);

CREATE TRIGGER trg_report_statuses_updated_at
    BEFORE UPDATE ON report_statuses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 7) Tabla: reports
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id               SERIAL PRIMARY KEY,
    reference_code   VARCHAR(20) NOT NULL UNIQUE,
    user_id          INTEGER NOT NULL REFERENCES users(id)              ON DELETE RESTRICT,
    category_id      INTEGER NOT NULL REFERENCES categories(id)         ON DELETE RESTRICT,
    status_id        INTEGER NOT NULL DEFAULT 1 REFERENCES report_statuses(id) ON DELETE RESTRICT,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    damage_type      damage_type NOT NULL,
    severity_level   severity_level NOT NULL DEFAULT 'low',
    latitude         DOUBLE PRECISION NOT NULL,
    longitude        DOUBLE PRECISION NOT NULL,
    location_address VARCHAR(255),
    image_url        VARCHAR(255),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reports IS 'Reportes de daños viales realizados por ciudadanos';

-- Índice de búsqueda espacial (PostGIS).
-- latitude/longitude son columnas ordinarias (FLOAT en Prisma) que conservan
-- compatibilidad espacial nativa vía índice GIST sobre expresión, permitiendo
-- ST_DWithin / ST_Distance sin columnas gestionadas por Prisma.
CREATE INDEX IF NOT EXISTS idx_reports_location
    ON reports USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports (status_id);
CREATE INDEX IF NOT EXISTS idx_reports_category   ON reports (category_id);
CREATE INDEX IF NOT EXISTS idx_reports_user       ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 8) Tabla: report_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_history (
    id                 SERIAL PRIMARY KEY,
    report_id          INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    previous_status_id INTEGER REFERENCES report_statuses(id),
    new_status_id      INTEGER NOT NULL REFERENCES report_statuses(id),
    changed_by_user_id INTEGER NOT NULL REFERENCES users(id),
    comment            TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE report_history IS 'Historial de cambios de estado de cada reporte';

CREATE INDEX IF NOT EXISTS idx_report_history_report ON report_history (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_history_user   ON report_history (changed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_status ON report_history (new_status_id);

-- ------------------------------------------------------------
-- 9) Datos iniciales (seeds)
-- ------------------------------------------------------------

-- Categorías de daños viales
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

-- Estados del flujo de reportes (order_index controla el orden en la UI)
INSERT INTO report_statuses (name, label, color, description, order_index) VALUES
    ('pending',     'Pendiente',   '#FFC107', 'Reporte recibido, pendiente de revisión',  10),
    ('in_review',   'En revisión', '#2196F3', 'Siendo evaluado por el equipo',            20),
    ('in_progress', 'En proceso',  '#FF9800', 'Trabajo en curso para resolverlo',         30),
    ('resolved',    'Resuelto',    '#4CAF50', 'Daño atendido y resuelto',                 40),
    ('rejected',    'Rechazado',   '#F44336', 'Reporte descartado por el equipo',         50)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------
-- 10) Verificación final
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgis'
  ) THEN
    RAISE EXCEPTION 'La extensión PostGIS no está disponible';
  END IF;
END $$;