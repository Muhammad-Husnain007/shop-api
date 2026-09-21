import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const envFile = path.join(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  const parsed = dotenv.parse(fs.readFileSync(envFile));
  for (const [key, value] of Object.entries(parsed)) {
    if (key.startsWith('PULSE_')) process.env[key] = value;
  }
}

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '127.0.0.1',
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@shop.local',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
};
