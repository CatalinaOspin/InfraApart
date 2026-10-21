# InfraApart

Plataforma web para el **reporte y gestión de daños viales** en el municipio de **Apartadó**, Antioquia, Colombia.

## Descripción

InfraApart permite a los ciudadanos reportar daños en la infraestructura vial (baches, grietas, inundaciones, daños en andenes, señalización deficiente, etc.) de forma sencilla e intuitiva. Los reportes se geolocalizan en un mapa interactivo, permitiendo a las autoridades municipales visualizar, priorizar y dar seguimiento a cada caso.

## Características Principales

- 🗺️ **Reporte geolocalizado** — Los ciudadanos pueden marcar la ubicación exacta del daño en un mapa interactivo.
- 📸 **Evidencia fotográfica** — Adjuntar fotos del daño reportado.
- 📊 **Dashboard administrativo** — Panel de control para visualizar estadísticas, métricas y tendencias de daños viales.
- 🔄 **Seguimiento de estados** — Cada reporte pasa por un ciclo: Recibido → En revisión → En proceso → Resuelto.
- 🗂️ **Categorías de daño** — Clasificación por tipo: baches, grietas, inundaciones, señalización, alumbrado, etc.
- 👥 **Gestión de usuarios** — Autenticación y roles (ciudadano, trabajador, supervisor de área, administrador).
- 📈 **Estadísticas y reportes** — Gráficas de daños por zona, categoría y temporalidad.

## Arquitectura

```
InfraApart/
├── backend/          # API REST — Node.js + Express + TypeScript
│   └── prisma/       # schema.prisma + migrations/ (estructura de la BD)
├── frontend/         # Aplicación Web — React + Vite + TypeScript
├── docker-compose.yml  # PostgreSQL + PostGIS (base de datos local)
└── README.md
```

## Stack Tecnológico

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL + PostGIS (geolocalización) — Neon en la nube
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
- Una base PostgreSQL + PostGIS: [Neon](https://neon.tech) (nube) o [Docker](https://www.docker.com/products/docker-desktop/) (local)
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

### 4. Base de datos (PostgreSQL + PostGIS)

La estructura de la base de datos se maneja con **migraciones de Prisma**:

- `backend/prisma/schema.prisma` → modelo de datos (fuente de verdad).
- `backend/prisma/migrations/` → SQL versionado que crea y actualiza la BD.
  La migración inicial incluye además PostGIS, la columna geográfica
  `reports.location`, validaciones (CHECK), triggers de `updated_at` y los
  datos iniciales (áreas, categorías y estados).

#### Opción A: Neon (nube)

1. Crea un proyecto en [Neon](https://neon.tech) y copia dos cadenas de
   conexión desde **Connect**:
   - **Con pooler** (host con `-pooler`) → `DATABASE_URL`
   - **Directa** (host sin `-pooler`) → `DIRECT_URL`
2. Pégalas en `backend/.env` (plantilla: `backend/.env.example`).
3. Crea las tablas:

```bash
cd backend
npm run prisma:deploy     # aplica las migraciones pendientes
npm run db:test           # verifica conexión, categorías y estados
```

#### Opción B: Docker (local)

```bash
docker compose up -d      # PostgreSQL 15 + PostGIS 3.3 (base vacía)
cd backend
npm run prisma:deploy     # crea las tablas en la base local
```

Credenciales locales (`docker-compose.yml`): base `infraapart_db`, usuario
`infraapart_user`, contraseña `infraapart_password`, puerto `5432`.

> 🔐 `.env` está en `.gitignore` y **nunca** se commitea.

#### Primer administrador

Después de crear la BD, regístrate desde la aplicación y cambia tu rol en el
editor SQL de Neon (o en `psql`):

```sql
UPDATE users SET role = 'admin' WHERE email = 'tu-correo@ejemplo.com';
```

### 5. Cambiar el modelo de datos

1. Edita `backend/prisma/schema.prisma`.
2. Genera la migración (requiere una BD de desarrollo, por ejemplo la local
   de Docker o una rama de Neon):

```bash
cd backend
npm run prisma:migrate -- --name descripcion_del_cambio
```

3. Haz commit de la carpeta `prisma/migrations/` junto con el schema.
4. Los demás (y producción) aplican el cambio con `npm run prisma:deploy`.

> ⚠️ No uses `prisma db push` sobre Neon/producción: no deja historial y
> no aplica el SQL adicional de las migraciones.

### 6. Comandos útiles

```bash
# Prisma (desde backend/)
npm run prisma:deploy      # aplica migraciones pendientes (Neon, local, Render)
npm run prisma:migrate     # crea una migración nueva a partir del schema (desarrollo)
npm run prisma:status      # muestra qué migraciones están aplicadas
npm run prisma:generate    # regenera el cliente tipado
npm run prisma:validate    # valida schema.prisma
npm run prisma:studio      # explorador visual de datos
npm run db:test            # prueba de conexión E2E

# Docker (desde la raíz)
docker compose up -d       # levantar la BD local
docker compose down        # detener (conserva datos)
docker compose down -v     # detener y borrar datos

# Health check (con la BD disponible)
curl http://localhost:3001/api/health
```

## Modelo de datos

13 tablas. Roles: `citizen` (ciudadano), `worker` (trabajador),
`supervisor` (supervisor de área) y `admin` (administrador).

| Tabla                | Para qué sirve |
| -------------------- | -------------- |
| `departments`        | Áreas responsables (Infraestructura vial, Alumbrado público, Drenaje…). |
| `users`              | Usuarios. Trabajadores y supervisores pertenecen a un área (`department_id`). |
| `user_tokens`        | Tokens temporales (hash) para recuperar contraseña y verificar correo. |
| `categories`         | Tipos de daño (`name` = clave de la API: `pothole`, `crack`…) y el área a la que se envían. |
| `report_statuses`    | Estados: Recibido → En revisión → En proceso → Resuelto / Rechazado. |
| `zones`              | Barrios, comunas, corregimientos y veredas (vacía hasta tener la lista oficial). |
| `reports`            | Reportes: ubicación (lat/lng + `location` PostGIS), dirección, barrio, punto de referencia, severidad, prioridad, área, trabajador asignado. |
| `report_history`     | Cambios de estado de cada reporte. |
| `report_assignments` | Historial de asignaciones (quién asignó, a quién, fecha límite). |
| `report_images`      | Fotos del reporte: `evidence` (ciudadano), `progress` y `resolution` (trabajador). Solo URL; el archivo vive en un servicio externo. |
| `report_comments`    | Comentarios; `is_internal = true` para notas entre supervisor y trabajador. |
| `report_supports`    | "A mí también me afecta": un apoyo por usuario y reporte. |
| `notifications`      | Avisos dentro de la plataforma (cambio de estado, asignación…). |

### Consultas geográficas (PostGIS)

`reports.location` es una columna `geography(Point, 4326)` **generada** a
partir de `latitude`/`longitude` y con índice GIST. La aplicación solo escribe
latitud y longitud; para buscar por distancia se usa `prisma.$queryRaw`:

```ts
// Reportes abiertos de la misma categoría a menos de 50 m (detección de duplicados)
const cercanos = await prisma.$queryRaw`
  SELECT id, reference_code,
         ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS distancia_m
  FROM reports
  WHERE category_id = ${categoryId}
    AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 50)
  ORDER BY distancia_m
`;
```

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
