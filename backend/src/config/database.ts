import { config } from './env';

// TODO: Configurar conexión a PostgreSQL con postgis
// import { Pool } from 'pg';
// const pool = new Pool({
//   host: config.db.host,
//   port: config.db.port,
//   database: config.db.name,
//   user: config.db.user,
//   password: config.db.password,
// });
// export default pool;

export const databaseConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
};

console.log('📦 Configuración de base de datos cargada');
