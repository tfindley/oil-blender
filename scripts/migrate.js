'use strict'

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id"                  VARCHAR(36)  NOT NULL,
      "checksum"            VARCHAR(64)  NOT NULL,
      "finished_at"         TIMESTAMPTZ,
      "migration_name"      VARCHAR(255) NOT NULL,
      "logs"                TEXT,
      "rolled_back_at"      TIMESTAMPTZ,
      "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER      NOT NULL DEFAULT 0,
      PRIMARY KEY ("id")
    )
  `)

  const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations')
  const entries = fs.readdirSync(migrationsDir)
    .filter(d => !d.endsWith('.toml'))
    .sort()

  for (const name of entries) {
    const sqlPath = path.join(migrationsDir, name, 'migration.sql')
    if (!fs.existsSync(sqlPath)) continue

    const { rows } = await pool.query(
      `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
      [name]
    )
    if (rows.length > 0) {
      console.log(`  ✓ ${name} (already applied)`)
      continue
    }

    const sql = fs.readFileSync(sqlPath, 'utf8')
    const checksum = crypto.createHash('sha256').update(sql).digest('hex').slice(0, 64)

    console.log(`  → Applying ${name}...`)
    await pool.query('BEGIN')
    try {
      await pool.query(sql)
      await pool.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
         VALUES ($1, $2, $3, NOW(), 1)`,
        [crypto.randomUUID(), checksum, name]
      )
      await pool.query('COMMIT')
      console.log(`  ✓ ${name}`)
    } catch (err) {
      await pool.query('ROLLBACK')
      throw err
    }
  }

  await pool.end()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
