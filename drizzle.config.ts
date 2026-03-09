import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './app/**/*schema.ts',
  out: './app/sql/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});