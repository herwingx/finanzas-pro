import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cliente Prisma centralizado usando Driver Adapter (pg).
 * Requerido para Prisma 7.x cuando el motor es engineType="client".
 */

// 1. Configurar conexión PG
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Crear adaptador
const adapter = new PrismaPg(pool);

// 3. Inicializar cliente con el adaptador
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
