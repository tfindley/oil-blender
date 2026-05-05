'use server'

import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { execFile } from 'child_process'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

const execFileAsync = promisify(execFile)

export interface MigrationStatus {
  name: string
  appliedAt: Date | null
  sql: string
}

async function readMigrationDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(dir)
    return entries.filter((d) => !d.endsWith('.toml')).sort()
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}

async function readMigrationSql(dir: string, name: string): Promise<string> {
  try {
    return await fs.promises.readFile(path.join(dir, name, 'migration.sql'), 'utf8')
  } catch {
    return ''
  }
}

export async function getMigrationStatus(): Promise<{
  applied: MigrationStatus[]
  pending: MigrationStatus[]
  latest: MigrationStatus | null
}> {
  const dir = path.join(process.cwd(), 'prisma', 'migrations')

  const rowsP = prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
    SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at
  `.catch(() => [])

  const dirs = await readMigrationDirs(dir)
  const rows = await rowsP

  const appliedMap = new Map(
    rows.filter((r) => r.finished_at).map((r) => [r.migration_name, r.finished_at!]),
  )

  const all: MigrationStatus[] = await Promise.all(
    dirs.map(async (name) => {
      const appliedAt = appliedMap.get(name) ?? null
      // Only pending migrations need their SQL loaded for preview.
      const sql = appliedAt === null ? await readMigrationSql(dir, name) : ''
      return { name, appliedAt, sql }
    }),
  )

  const applied = all.filter((m) => m.appliedAt !== null)
  return {
    applied,
    pending: all.filter((m) => m.appliedAt === null),
    latest: applied.at(-1) ?? null,
  }
}

export async function applyPendingMigrations(): Promise<{ ok: boolean; message: string }> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'migrate.js')
  try {
    const { stdout } = await execFileAsync('node', [scriptPath], {
      env: { ...process.env },
      timeout: 60_000,
    })
    const appliedCount = (stdout.match(/→ Applying/g) ?? []).length
    revalidatePath('/admin/database')
    return {
      ok: true,
      message: appliedCount > 0
        ? `Applied ${appliedCount} migration${appliedCount === 1 ? '' : 's'}.`
        : 'No pending migrations.',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: msg.slice(0, 500) }
  }
}
