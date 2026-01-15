/**
 * Prisma Config - Configuración del CLI para Prisma 7+
 *
 * Este archivo configura el CLI de Prisma (migraciones, studio, etc.)
 * La URL de conexión se define aquí en lugar del schema.prisma
 *
 * @see https://pris.ly/d/config-datasource
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Ubicación del schema
  schema: 'prisma/schema.prisma',

  // Configuración de migraciones
  migrations: {
    path: 'prisma/migrations',
  },

  // Datasource para el CLI (migraciones, introspection, etc.)
  datasource: {
    url: env('DATABASE_URL'),
  },
});
