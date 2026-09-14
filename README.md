# InfraApart

Plataforma web para el **reporte y gestión de daños viales** en el municipio de **Apartadó**, Antioquia, Colombia.

## Descripción

InfraApart permite a los ciudadanos reportar daños en la infraestructura vial (baches, grietas, inundaciones, daños en andenes, señalización deficiente, etc.) de forma sencilla e intuitiva. Los reportes se geolocalizan en un mapa interactivo, permitiendo a las autoridades municipales visualizar, priorizar y dar seguimiento a cada caso.

## Características Principales

- 🗺️ **Reporte geolocalizado** — Los ciudadanos pueden marcar la ubicación exacta del daño en un mapa interactivo.
- 📸 **Evidencia fotográfica** — Adjuntar fotos del daño reportado.
- 📊 **Dashboard administrativo** — Panel de control para visualizar estadísticas, métricas y tendencias de daños viales.
- 🔄 **Seguimiento de estados** — Cada reporte pasa por un ciclo: Pendiente → En revisión → En proceso → Resuelto.
- 🗂️ **Categorías de daño** — Clasificación por tipo: baches, grietas, inundaciones, señalización, alumbrado, etc.
- 👥 **Gestión de usuarios** — Autenticación y roles (ciudadano, administrador).
- 📈 **Estadísticas y reportes** — Gráficas de daños por zona, categoría y temporalidad.

## Arquitectura

```
InfraApart/
├── backend/          # API REST — Node.js + Express + TypeScript
│   └── prisma/       # Schema y migraciones de Prisma ORM
├── frontend/         # Aplicación Web — React + Vite + TypeScript
├── docs/             # Documentación del proyecto
│   └── database_schema.sql
├── docker-compose.yml  # PostgreSQL + PostGIS (base de datos local)
└── README.md
```

## Stack Tecnológico

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL + PostGIS (geolocalización)
- **ORM:** Prisma ORM v6 (`prisma` + `@prisma/client`)
- **Base de datos local:** Docker Compose (`postgis/postgis:15-3.3`)
- **Autenticación:** JWT (JSON Web Tokens)

### Frontend
- **Framework:** React 18
- **Bundler:** Vite
- **Lenguaje:** TypeScript
- **Estilos:** (Por definir — Tailwind CSS / styled-components)
- **Mapas:** (Por definir — Leaflet / Mapbox GL)

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+ o [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/products/docker-desktop/) (para la base de datos PostgreSQL + PostGIS)
- Git

## Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/InfraApart.git
cd InfraApart
```

### 2. Configurar el Backend

```bash
cd backend
cp .env.example .env      # Configurar variables de entorno
npm install
npm run dev               # Servidor en http://localhost:3001
```

> El backend verifica la conexión con la base de datos al arrancar
> (`connectDB()` en `src/config/database.ts`). Si PostgreSQL no está
> levantado, el servidor no inicia y muestra el error en consola.

### 3. Configurar el Frontend

```bash
cd frontend
cp .env.example .env      # Configurar variables de entorno
npm install
npm run dev               # App en http://localhost:5173
```

### 4. Base de Datos (PostgreSQL + PostGIS con Docker)

```bash
# Desde la raíz del proyecto (primera vez: descarga la imagen)
docker compose up -d

# Verificar que el contenedor está saludable
docker compose ps

# Al primer arranque, el esquema (docs/database_schema.sql) se ejecuta
# automáticamente: crea tablas, índices GIST, datos iniciales y triggers.
```

> 💾 **Cambios de esquema:** el script del init solo corre sobre un volumen
> **nuevo**. Si ya inicializaste la BD con una versión anterior del esquema
> (e.g. el modelo de la Fase 2), recrea el volumen para aplicar el modelo de
> la Fase 3:
>
> ```bash
> docker compose down -v && docker compose up -d
> ```

**Credenciales locales** (definidas en `docker-compose.yml`):

| Variable            | Valor                 |
| ------------------- | --------------------- |
| Base de datos       | `infraapart_db`       |
| Usuario             | `infraapart_user`     |
| Contraseña          | `infraapart_password` |
| Puerto              | `5432`                |
| PostGIS             | `3.3` (PostgreSQL 15) |

#### Base de datos en la nube (Supabase) — alternativa a Docker

Con Prisma se usan **dos URLs** (`backend/.env`, ver plantilla en
`backend/.env.example`):

| Variable       | Puerto | Uso                                                        |
| -------------- | ------ | ---------------------------------------------------------- |
| `DATABASE_URL` | 6543   | **Transaction Pooler (PgBouncer)** → Prisma Client en runtime. Incluye `?pgbouncer=true&connection_limit=1`. |
| `DIRECT_URL`   | 5432   | **Conexión directa** → CLI de Prisma (`db push` / `migrate`). |

> 🔐 `.env` está en `.gitignore` y **nunca** se commitea. `.env.example` es
> solo plantilla (sin credenciales reales). Si una clave se filtró a git,
> rótala en Supabase (Project Settings → Database → Reset database password).

```bash
cd backend
cp .env.example .env          # pega las cadenas REALES desde el dashboard
npm run prisma:push           # crea tablas y enums en la nube
npm run prisma:generate       # regenera el cliente tipado
npm run prisma:postgis        # PostGIS: search_path, índice GIST, triggers, seeds
npm run db:test               # handshake + consultas reales (vía pooler)
```

> ⚠️ `prisma db push` **no** crea la extensión PostGIS, el índice GIST de
> búsqueda espacial, los triggers de `updated_at` ni los seeds. Ejecuta
> `npm run prisma:postgis` (aplica `backend/prisma/postgis-supabase.sql`, que
> es idempotente). Equivalente manual: Supabase → SQL Editor, o
> `psql "$DIRECT_URL" -f prisma/postgis-supabase.sql`.
>
> ℹ️ Particularidades de Supabase que asume ese suplemento: PostGIS se instala
> en el schema `postgis` (no `public`), por lo que el script añade ese schema
> al `search_path` del rol (`ALTER ROLE postgres SET search_path ...`) para
> que `ST_MakePoint`, `ST_SetSRID` y el tipo `geography` resuelvan sin
> calificar. Además, `updated_at` lleva `@default(now()) @updatedAt` en el
> schema Prisma para que los inserts por SQL crudo no violen NOT NULL.

### 5. Sincronizar el esquema con Prisma

La fuente de verdad de la BD es `docs/database_schema.sql` (ya aplicado por
Docker). Para que el schema de Prisma refleje la BD real:

```bash
cd backend
npx prisma db pull        # Introspecta la BD y actualiza prisma/schema.prisma
npx prisma generate       # Regenera el cliente tipado
```

> ⚠️ `prisma db push` funciona en entornos de desarrollo, pero puede
> simplificar/omitir particularidades del SQL (CHECKs, `geometry` de PostGIS
> e índices GIST). Se recomienda **`db pull`** para mantener `schema.prisma`
> alineado con la base de datos creada por el script.

### 6. Comandos útiles

```bash
docker compose up -d                          # Levantar la BD
docker compose down                           # Detener la BD (conserva datos)
docker compose down -v                        # Detener y borrar datos
docker compose logs -f db                     # Ver logs del contenedor
docker exec -it infraapart_db psql -U infraapart_user -d infraapart_db  # Consola psql

# Prisma (desde backend/)
npm run prisma:generate    # prisma generate
npm run prisma:validate    # prisma validate
npm run prisma:pull        # prisma db pull
npm run prisma:push        # prisma db push (dev)
npm run prisma:studio      # prisma studio (nav visual)
npm run db:test            # Prueba de conexión E2E (handshake + consultas reales)

# Health check (con la BD levantada)
curl http://localhost:3001/api/health
#   → 200 {"status":"ok","db":"connected",...}
#   → 503 {"status":"degraded","db":"disconnected",...} si la BD no responde
```

## PostGIS con Prisma (geolocalización)

Modelo geográfico (definido en `docs/database_schema.sql`):

- `reports.latitude` y `reports.longitude` son columnas `DOUBLE PRECISION`
  (mapeadas como `Float` en Prisma): la app las lee/escribe con el cliente
  normal, sin SQL crudo.
- PostGIS queda disponible vía un **índice GIST sobre expresión**:

  ```sql
  CREATE INDEX idx_reports_location
    ON reports USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
  ```

  Así `ST_DWithin` y `ST_Distance` usan el índice espacial **sin** necesidad
  de una columna `GEOMETRY`/`Unsupported(...)`, que Prisma no gestiona.

Patrón de consultas espaciales (raw SQL con `prisma.$queryRaw`):

```ts
import { prisma } from '../config/database';

// 📍 Crear reporte (lat/lng se escriben como columnas normales)
const report = await prisma.report.create({
  data: {
    title: 'Bache en la Av. Primera',
    latitude: 7.883,
    longitude: -76.633,
    // categoryId, statusId, damageType, severityLevel, ...
  },
});

// 📍 Búsqueda por radio (usa el índice GIST de docs/database_schema.sql)
const cercanos = await prisma.$queryRaw`
  SELECT id, title, latitude, longitude,
         ST_Distance(
           ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
           ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
         ) AS dist_m
  FROM reports
  WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${radioM}
        )
  ORDER BY dist_m
`;
```

### Modelo de datos (5 tablas + enums)

Fuente de verdad: `docs/database_schema.sql` → `schema.prisma`.

| Tabla            | Campos destacados                                      |
| ---------------- | ------------------------------------------------------ |
| `users`          | `full_name`, `email` (único), `password_hash`, `role` (`user_role`), `phone`, `is_active` |
| `categories`     | `name` (único), `description`, `icon`, `is_active`     |
| `report_statuses`| `name` (único), `label`, `color`, `description`, `is_active`, `order_index` |
| `reports`        | `reference_code` (único), `title`, `damage_type` (`damage_type`), `severity_level` (`severity_level`), `latitude`/`longitude`, `location_address`, `image_url` |
| `report_history` | `previous_status_id`?, `new_status_id`, `changed_by_user_id`, `comment` |

Enums nativos de PostgreSQL: `user_role` (`citizen|admin`), `damage_type`
(`pothole|crack|flooding|sidewalk|signage|lighting|drainage|other`) y
`severity_level` (`low|medium|high|critical`). Prisma los introspecta como
enums propios (`UserRole`, `DamageType`, `SeverityLevel`).

## Estructura del Proyecto

### Backend (`backend/`)

```
src/
├── config/          # Configuración de variables de entorno, BD (Prisma client)
├── controllers/     # Lógica de manejo de peticiones
├── models/          # Entidades y esquemas de base de datos
├── routes/          # Definición de rutas de la API
├── middlewares/      # Autenticación, validación, errores
├── utils/           # Helpers y funciones utilitarias
├── types/           # Definiciones y tipos de TypeScript
├── app.ts           # Configuración de Express
├── server.ts        # Punto de entrada del servidor (conecta la BD al iniciar)
├── prisma/          # Schema de Prisma ORM
└── prisma.config.ts # Configuración del CLI de Prisma
```

### Frontend (`frontend/`)

```
src/
├── assets/          # Imágenes, iconos, fuentes
├── components/      # Componentes reutilizables
│   ├── ui/          # Componentes de interfaz base
│   ├── map/         # Componentes del mapa
│   ├── dashboard/   # Componentes del panel administrativo
│   ├── forms/       # Formularios de reporte
│   └── common/      # Componentes comunes (header, footer, etc.)
├── pages/           # Páginas/vistas de la aplicación
├── services/        # Servicios de comunicación con la API
├── hooks/           # Custom hooks de React
├── context/         # Contextos globales de estado
├── types/           # Definiciones de tipos TypeScript
└── routes/          # Configuración de rutas de navegación
```

## Equipo de Desarrollo

- **Tech Lead / Arquitecto:** Catalina
- **Municipio:** Apartadó, Antioquia, Colombia

## Licencia

Proyecto privado — Municipio de Apartadó.
