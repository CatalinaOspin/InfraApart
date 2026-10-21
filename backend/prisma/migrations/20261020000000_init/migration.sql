-- ============================================================
-- InfraApart · Migración inicial
-- Generada con prisma migrate diff a partir de schema.prisma y
-- completada a mano con PostGIS, columna generada, validaciones,
-- triggers y datos iniciales. Se aplica con: npm run prisma:deploy
-- ============================================================

-- PostGIS (disponible en Neon y en la imagen postgis/postgis de Docker)
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('citizen', 'worker', 'supervisor', 'admin');

-- CreateEnum
CREATE TYPE "severity_level" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "report_priority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "location_source" AS ENUM ('gps', 'map_pin', 'manual');

-- CreateEnum
CREATE TYPE "zone_type" AS ENUM ('neighborhood', 'commune', 'township', 'rural_area');

-- CreateEnum
CREATE TYPE "image_kind" AS ENUM ('evidence', 'progress', 'resolution');

-- CreateEnum
CREATE TYPE "token_type" AS ENUM ('password_reset', 'email_verification');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('status_changed', 'report_assigned', 'new_comment', 'report_supported', 'system');

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'citizen',
    "phone" VARCHAR(20),
    "department_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "token_type" NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "department_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_statuses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#CCCCCC',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "zone_type" NOT NULL,
    "parent_id" INTEGER,
    "boundary" geography(MultiPolygon, 4326),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reference_code" VARCHAR(20) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "assigned_to_id" INTEGER,
    "zone_id" INTEGER,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "severity_level" "severity_level" NOT NULL DEFAULT 'low',
    "priority" "report_priority" NOT NULL DEFAULT 'normal',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    -- Calculada automáticamente desde latitude/longitude
    "location" geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography) STORED,
    "location_source" "location_source" NOT NULL DEFAULT 'manual',
    "address" VARCHAR(255),
    "neighborhood" VARCHAR(120),
    "reference_point" VARCHAR(255),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_history" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "previous_status_id" INTEGER,
    "new_status_id" INTEGER NOT NULL,
    "changed_by_user_id" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_assignments" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "assigned_to_id" INTEGER NOT NULL,
    "assigned_by_id" INTEGER NOT NULL,
    "due_date" DATE,
    "notes" TEXT,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMPTZ(6),

    CONSTRAINT "report_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_images" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "uploaded_by_id" INTEGER NOT NULL,
    "kind" "image_kind" NOT NULL DEFAULT 'evidence',
    "url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(255),
    "mime_type" VARCHAR(50),
    "size_bytes" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_comments" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_supports" (
    "report_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_supports_pkey" PRIMARY KEY ("report_id","user_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "report_id" INTEGER,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_token_hash_key" ON "user_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "user_tokens_user_id_type_idx" ON "user_tokens"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_department_id_idx" ON "categories"("department_id");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "report_statuses_name_key" ON "report_statuses"("name");

-- CreateIndex
CREATE INDEX "report_statuses_is_active_idx" ON "report_statuses"("is_active");

-- CreateIndex
CREATE INDEX "zones_parent_id_idx" ON "zones"("parent_id");

-- CreateIndex
CREATE INDEX "zones_boundary_idx" ON "zones" USING GIST ("boundary");

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_type_key" ON "zones"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reference_code_key" ON "reports"("reference_code");

-- CreateIndex
CREATE INDEX "reports_status_id_idx" ON "reports"("status_id");

-- CreateIndex
CREATE INDEX "reports_category_id_idx" ON "reports"("category_id");

-- CreateIndex
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex
CREATE INDEX "reports_department_id_status_id_idx" ON "reports"("department_id", "status_id");

-- CreateIndex
CREATE INDEX "reports_assigned_to_id_status_id_idx" ON "reports"("assigned_to_id", "status_id");

-- CreateIndex
CREATE INDEX "reports_zone_id_idx" ON "reports"("zone_id");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_location_idx" ON "reports" USING GIST ("location");

-- CreateIndex
CREATE INDEX "report_history_report_id_created_at_idx" ON "report_history"("report_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_history_changed_by_user_id_idx" ON "report_history"("changed_by_user_id");

-- CreateIndex
CREATE INDEX "report_history_new_status_id_idx" ON "report_history"("new_status_id");

-- CreateIndex
CREATE INDEX "report_assignments_report_id_assigned_at_idx" ON "report_assignments"("report_id", "assigned_at" DESC);

-- CreateIndex
CREATE INDEX "report_assignments_assigned_to_id_idx" ON "report_assignments"("assigned_to_id");

-- CreateIndex
CREATE INDEX "report_images_report_id_kind_idx" ON "report_images"("report_id", "kind");

-- CreateIndex
CREATE INDEX "report_comments_report_id_created_at_idx" ON "report_comments"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "report_supports_user_id_idx" ON "report_supports"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "report_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_previous_status_id_fkey" FOREIGN KEY ("previous_status_id") REFERENCES "report_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_new_status_id_fkey" FOREIGN KEY ("new_status_id") REFERENCES "report_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_assignments" ADD CONSTRAINT "report_assignments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_assignments" ADD CONSTRAINT "report_assignments_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_assignments" ADD CONSTRAINT "report_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_comments" ADD CONSTRAINT "report_comments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_comments" ADD CONSTRAINT "report_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_supports" ADD CONSTRAINT "report_supports_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_supports" ADD CONSTRAINT "report_supports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- SQL adicional (no lo genera Prisma)
-- ============================================================

-- Validaciones de datos
ALTER TABLE "reports" ADD CONSTRAINT "reports_latitude_check" CHECK ("latitude" BETWEEN -90 AND 90);
ALTER TABLE "reports" ADD CONSTRAINT "reports_longitude_check" CHECK ("longitude" BETWEEN -180 AND 180);
ALTER TABLE "report_comments" ADD CONSTRAINT "report_comments_body_check" CHECK (length(trim("body")) > 0);
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_size_check" CHECK ("size_bytes" IS NULL OR "size_bytes" > 0);
ALTER TABLE "zones" ADD CONSTRAINT "zones_parent_check" CHECK ("parent_id" IS NULL OR "parent_id" <> "id");

-- Asignaciones vigentes: un reporte solo puede tener una asignación abierta a la vez
CREATE UNIQUE INDEX "report_assignments_one_open_idx"
    ON "report_assignments" ("report_id") WHERE "unassigned_at" IS NULL;

-- Notificaciones no leídas (consulta frecuente de la campana de avisos)
CREATE INDEX "notifications_unread_idx"
    ON "notifications" ("user_id", "created_at" DESC) WHERE "read_at" IS NULL;

-- updated_at automático también para cambios hechos con SQL directo
-- (Prisma Client ya lo actualiza con @updatedAt).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON "departments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_statuses_updated_at BEFORE UPDATE ON "report_statuses" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_zones_updated_at BEFORE UPDATE ON "zones" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON "reports" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_report_comments_updated_at BEFORE UPDATE ON "report_comments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Datos iniciales
-- ============================================================

-- Áreas responsables (editables por el administrador)
INSERT INTO "departments" ("name", "description") VALUES
    ('Infraestructura vial',      'Pavimento, huecos, grietas y andenes'),
    ('Alumbrado público',         'Luminarias y postes de alumbrado'),
    ('Drenaje y alcantarillado',  'Inundaciones, sumideros y alcantarillas'),
    ('Movilidad y señalización',  'Señales de tránsito y demarcación vial'),
    ('General',                   'Reportes que no corresponden a otra área');

-- Categorías de daño (name = clave que usa la API) y su área responsable
INSERT INTO "categories" ("name", "label", "description", "icon", "department_id") VALUES
    ('pothole',  'Hueco/bache',          'Hueco o bache en la vía',          'pothole',  (SELECT "id" FROM "departments" WHERE "name" = 'Infraestructura vial')),
    ('crack',    'Grieta',               'Grieta o fisura en el pavimento',  'crack',    (SELECT "id" FROM "departments" WHERE "name" = 'Infraestructura vial')),
    ('sidewalk', 'Andén deteriorado',    'Andén o acera en mal estado',      'sidewalk', (SELECT "id" FROM "departments" WHERE "name" = 'Infraestructura vial')),
    ('lighting', 'Alumbrado público',    'Alumbrado público averiado',       'lighting', (SELECT "id" FROM "departments" WHERE "name" = 'Alumbrado público')),
    ('flooding', 'Inundación',           'Acumulación de agua o inundación', 'flooding', (SELECT "id" FROM "departments" WHERE "name" = 'Drenaje y alcantarillado')),
    ('drainage', 'Drenaje/alcantarilla', 'Drenaje obstruido o dañado',       'drainage', (SELECT "id" FROM "departments" WHERE "name" = 'Drenaje y alcantarillado')),
    ('signage',  'Señalización',         'Señalización dañada o ausente',    'signage',  (SELECT "id" FROM "departments" WHERE "name" = 'Movilidad y señalización')),
    ('other',    'Otro',                 'Otro tipo de daño',                'other',    (SELECT "id" FROM "departments" WHERE "name" = 'General'));

-- Estados del flujo de reportes (order_index controla el orden en la UI)
INSERT INTO "report_statuses" ("name", "label", "color", "description", "order_index") VALUES
    ('pending',     'Recibido',    '#FFC107', 'Reporte recibido, pendiente de revisión', 10),
    ('in_review',   'En revisión', '#2196F3', 'Siendo evaluado por el área responsable', 20),
    ('in_progress', 'En proceso',  '#FF9800', 'Trabajo en curso para resolverlo',        30),
    ('resolved',    'Resuelto',    '#4CAF50', 'Daño atendido y resuelto',                40),
    ('rejected',    'Rechazado',   '#F44336', 'Reporte descartado por el área',          50);
