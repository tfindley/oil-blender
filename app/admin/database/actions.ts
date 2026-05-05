'use server'

import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'

const execFileAsync = promisify(execFile)

function resolveScript(jsName: string, tsName: string): [string, string[]] {
  const jsPath = path.join(process.cwd(), 'scripts', jsName)
  if (fs.existsSync(jsPath)) {
    return ['node', [jsPath]]
  }
  const tsxBin = path.join(process.cwd(), 'node_modules', '.bin', 'tsx')
  const tsPath = path.join(process.cwd(), 'scripts', tsName)
  return [tsxBin, [tsPath]]
}

export async function seedDatabase(): Promise<{ ok: boolean; message: string }> {
  const [cmd, args] = resolveScript('seed.js', 'seed.ts')
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      env: { ...process.env },
      timeout: 60_000,
    })
    const output = stdout + stderr
    const oilMatch = output.match(/(\d+)\s+oil/i)
    const pairingMatch = output.match(/(\d+)\s+pairing/i)
    const detail =
      oilMatch || pairingMatch
        ? `${oilMatch?.[1] ?? '?'} oils, ${pairingMatch?.[1] ?? '?'} pairings`
        : 'complete'
    revalidatePath('/admin/database')
    return { ok: true, message: `Seed ${detail}` }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: msg.slice(0, 300) }
  }
}

export async function runEnrichment(force = false): Promise<{ ok: boolean; message: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, message: 'ANTHROPIC_API_KEY is not set' }
  }
  const [cmd, args] = resolveScript('enrich.js', 'enrich-oils.ts')
  const child = spawn(cmd, args, {
    detached: true,
    stdio: 'inherit',
    env: { ...process.env, ...(force ? { FORCE_REENRICH: '1' } : {}) },
  })
  child.unref()
  return {
    ok: true,
    message: force
      ? 'Force re-enrichment started — re-processing all oils. Check server logs.'
      : 'Enrichment started. Only oils not yet enriched will be processed. Check server logs.',
  }
}
