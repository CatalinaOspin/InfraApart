-- ============================================================
-- InfraApart · Tabla de roles
-- Reemplaza el enum users.role por la tabla roles (users.role_id).
-- Conserva el rol de los usuarios existentes.
-- ============================================================

-- 1) Tabla de roles
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON "roles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2) Roles base
INSERT INTO "roles" ("name", "label", "description") VALUES
    ('citizen',    'Ciudadano',     'Reporta daños, apoya reportes y consulta su estado'),
    ('worker',     'Trabajador',    'Atiende los reportes que se le asignan'),
    ('supervisor', 'Supervisor',    'Gestiona y asigna los reportes de su área'),
    ('admin',      'Administrador', 'Acceso total a la plataforma');

-- 3) users.role (enum) -> users.role_id (FK), conservando el rol actual
ALTER TABLE "users" ADD COLUMN "role_id" INTEGER;

UPDATE "users" u SET "role_id" = r."id" FROM "roles" r WHERE r."name" = u."role"::text;

ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "users_role_id_idx" ON "users"("role_id");

DROP INDEX "users_role_idx";

ALTER TABLE "users" DROP COLUMN "role";

DROP TYPE "user_role";
