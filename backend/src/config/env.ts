import dotenv from 'dotenv';
import path from 'path';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'infraapart_db',
    user: process.env.DB_USER || 'infraapart_user',
    password: process.env.DB_PASSWORD || 'infraapart_password',
    databaseUrl: process.env.DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_me',
    // @types/jsonwebtoken v9 exige StringValue (p. ej. '24h'); `as` es de
    // compilación: el valor real se lee del .env en runtime.
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'],
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },

  paths: {
    root: path.resolve(__dirname, '../..'),
    uploads: path.resolve(__dirname, '../../uploads'),
  },
};
