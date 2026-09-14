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
├── frontend/         # Aplicación Web — React + Vite + TypeScript
├── docs/             # Documentación del proyecto
│   └── database_schema.sql
└── README.md
```

## Stack Tecnológico

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL + PostGIS (geolocalización)
- **ORM:** (Por definir — Prisma / TypeORM)
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
- [PostgreSQL](https://www.postgresql.org/) v15+ con extensión PostGIS
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

### 3. Configurar el Frontend

```bash
cd frontend
cp .env.example .env      # Configurar variables de entorno
npm install
npm run dev               # App en http://localhost:5173
```

### 4. Base de Datos

```bash
# Crear la base de datos y ejecutar el esquema
psql -U postgres -c "CREATE DATABASE infraapart;"
psql -U postgres -d infraapart -f docs/database_schema.sql
```

## Estructura del Proyecto

### Backend (`backend/`)

```
src/
├── config/          # Configuración de variables de entorno, BD
├── controllers/     # Lógica de manejo de peticiones
├── models/          # Entidades y esquemas de base de datos
├── routes/          # Definición de rutas de la API
├── middlewares/      # Autenticación, validación, errores
├── utils/           # Helpers y funciones utilitarias
├── types/           # Definiciones y tipos de TypeScript
├── app.ts           # Configuración de Express
└── server.ts        # Punto de entrada del servidor
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
