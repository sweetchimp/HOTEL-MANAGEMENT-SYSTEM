// ============================================================
// Dev Orchestrator — Starts both API and frontend together
// Run: npm run dev
// ============================================================

import { spawn } from 'child_process'
import { resolve } from 'path'

const ROOT = resolve('.')
const isWin = process.platform === 'win32'

function start(name, cmd, args, cwd) {
  const child = spawn(cmd, args, {
    cwd,
    shell: isWin,
    stdio: 'inherit',
  })
  child.on('error', (err) => {
    console.error(`[${name}] failed to start:`, err.message)
    process.exit(1)
  })
  child.on('exit', (code) => {
    console.error(`[${name}] exited with code ${code}`)
    cleanup()
  })
  return child
}

const children = []

function cleanup() {
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

children.push(start('api', 'npx', ['tsx', 'dev-server.js'], ROOT))
children.push(start('frontend', 'npm', ['run', 'dev'], resolve(ROOT, 'frontend')))
