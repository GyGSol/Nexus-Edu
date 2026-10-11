#!/usr/bin/env node
/**
 * Lanza un comando sin ELECTRON_RUN_AS_NODE (rompe Electron en Cursor/Windows).
 * Uso: node scripts/run-with-clean-env.mjs <cmd> [...args]
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Uso: node scripts/run-with-clean-env.mjs <comando> [...args]')
  process.exit(1)
}

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const [cmd, ...cmdArgs] = args
const isWin = process.platform === 'win32'
const child = spawn(cmd, cmdArgs, {
  env,
  stdio: 'inherit',
  shell: isWin,
  cwd: join(dirname(fileURLToPath(import.meta.url)), '..')
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
