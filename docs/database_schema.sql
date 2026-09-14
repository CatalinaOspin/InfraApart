-- ============================================================
-- InfraApart - Esquema de Base de Datos
-- PostgreSQL + PostGIS
-- Municipio de Apartadó - Reporte y gestión de daños viales
-- ============================================================

-- Extensión PostGIS para datos geográficos
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- TABLA: users
-- Usuarios del sistema (ciudadanos y administradores)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(20),
    role          VARCHAR(20) NOT NULL DEFAULT 'citizen'
                  CHECK (role IN ('citizen', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: categories
-- Categorías de daños viales
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    label       VARCHAR(100) NOT NULL,
    icon        VARCHAR(50),
    description TEXT
);

-- Datos iniciales de categorías
INSERT INTO categories (name, label, icon, description) VALUES
    ('pothole',    'Bache',             '🕳️',  'Hueco o bache en la vía'),
    ('crack',      'Grieta',            '➖',   'Grieta o fisura en el pavimento'),
    ('flooding',   'Inundación',        '🌊',   'Acumulación de agua en la vía'),
    ('sidewalk',   'Daño en andén',     '🚶',   'Andén o acera dañada'),
    ('signage',    'Señalización',      '🪧',   'Señal de tránsito dañada o ausente'),
    ('lighting',   'Alumbrado público', '💡',   'Luminaria dañada o sin funcionar'),
    ('drainage',   'Drenaje',           '🚰',   'Sumidero o alcantarilla obstruida'),
    ('other',      'Otro',              '⚠️',   'Otro tipo de daño vial')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TABLA: report_statuses
-- Estados posibles del ciclo de vida de un reporte
-- ============================================================
CREATE TABLE IF NOT EXISTS report_statuses (
    id     SERIAL PRIMARY KEY,
    name   VARCHAR(30) NOT NULL UNIQUE,
    label  VARCHAR(80) NOT NULL,
    color  VARCHAR(20) NOT NULL DEFAULT '#CCCCCC'
);

-- Datos iniciales de estados
INSERT INTO report_statuses (name, label, color) VALUES
    ('pending',     'Pendiente',     '#FFC107'),
    ('in_review',   'En revisión',   '#2196F3'),
    ('in_progress', 'En proceso',    '#FF9800'),
    ('resolved',    'Resuelto',      '#4CAF50'),
    ('rejected',    'Rechazado',     '#F44336')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TABLA: reports
-- Reportes de daños viales realizados por los ciudadanos
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id    INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    status_id      INTEGER NOT NULL DEFAULT 1 REFERENCES report_statuses(id),
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    location       GEOMETRY(POINT, 4326) NOT NULL,      -- Coordenadas WGS84
    address        VARCHAR(255),
    neighborhood   VARCHAR(100),
    photo_url      VARCHAR(255),
    reference_code VARCHAR(20) NOT NULL UNIQUE,          -- Código para seguimiento ciudadano
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice espacial para búsquedas geográficas
CREATE INDEX IF NOT EXISTS idx_reports_location
    ON reports USING GIST (location);

-- Índices para filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_reports_status
    ON reports (status_id);

CREATE INDEX IF NOT EXISTS idx_reports_category
    ON reports (category_id);

CREATE INDEX IF NOT EXISTS idx_reports_user
    ON reports (user_id);

CREATE INDEX IF NOT EXISTS idx_reports_created_at
    ON reports (created_at DESC);

-- ============================================================
-- TABLA: report_history
-- Historial de cambios de estado de cada reporte
-- ============================================================
CREATE TABLE IF NOT EXISTS report_history (
    id          SERIAL PRIMARY KEY,
    report_id   INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    status_id   INTEGER NOT NULL REFERENCES report_statuses(id),
    changed_by  INTEGER NOT NULL REFERENCES users(id),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_history_report
    ON report_history (report_id, created_at DESC);

-- ============================================================
-- VISTA ÚTIL: vista_resumen_reportes
-- Resumen de cada reporte con nombres legibles
-- (comentada por ahora, se habilitará cuando sea necesaria)
-- ============================================================
-- CREATE OR REPLACE VIEW vw_reports_summary AS
-- SELECT
--     r.id,
--     r.reference_code,
--     r.title,
--     r.description,
--     ST_AsText(r.location) AS location,
--     r.address,
--     r.neighborhood,
--     c.name  AS category,
--     c.label AS category_label,
--     s.name  AS status,
--     s.label AS status_label,
--     r.created_at,
--     r.updated_at
-- FROM reports r
-- JOIN categories c       ON c.id = r.category_id
-- JOIN report_statuses s  ON s.id = r.status_id;

-- ============================================================
-- TRIGGER: actualizar updated_at automáticamente
-- ============================================================
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
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON reports;
CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================