import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://oils:oils@localhost:5432/oils',
  },
  migrate: {
    async adapter(env: Record<string, string | undefined>) {
      const { Pool } = await import('pg')
      const pool = new Pool({ connectionString: env.DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
} as any)
