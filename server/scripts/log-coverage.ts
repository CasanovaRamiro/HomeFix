import { readdirSync, readFileSync } from 'fs'
import { resolve, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const src = resolve(root, 'src')

const READONLY_PREFIXES = ['get', 'find', 'list', 'is']

interface FuncDef {
  name: string
  index: number
  line: number
}

interface FileResult {
  file: string
  total: number
  auditTotal: number
  covered: number
  pct: string
  skipped: { name: string; line: number }[]
  uncovered: { name: string; line: number }[]
  actions: { name: string; action: string }[]
}

const FUNC_RE = /^export\s+(async\s+)?(?:const|function)\s+(\w+)\s*(?:[=(]|\b)/gm
const ACTION_RE = /action:\s*'([^']+)'/g

function isReadOnly(name: string): boolean {
  return READONLY_PREFIXES.some((p) => name.startsWith(p) && name.length > p.length && name[p.length] === name[p.length].toUpperCase())
}

function findFunctions(content: string): FuncDef[] {
  const funcs: FuncDef[] = []
  let match: RegExpExecArray | null
  while ((match = FUNC_RE.exec(content)) !== null) {
    const name = match[2]
    const index = match.index
    const line = content.slice(0, index).split('\n').length
    if (name !== 'default' && name !== '_provider' && !name.startsWith('_')) {
      funcs.push({ name, index, line })
    }
  }
  return funcs
}

function findActions(content: string): { action: string; index: number }[] {
  const actions: { action: string; index: number }[] = []
  let match: RegExpExecArray | null
  while ((match = ACTION_RE.exec(content)) !== null) {
    const idx = match.index
    const lineStart = content.lastIndexOf('\n', idx)
    const hasLoggerBefore = content.lastIndexOf('logger.', idx) > lineStart
    if (hasLoggerBefore) {
      actions.push({ action: match[1], index: idx })
    }
  }
  return actions
}

function computeCoverage(filePath: string, skipReadonly: boolean): FileResult {
  const content = readFileSync(filePath, 'utf-8')
  const funcs = findFunctions(content)
  const actions = findActions(content)

  const skipped: FuncDef[] = []
  const auditable: FuncDef[] = []
  for (const f of funcs) {
    if (skipReadonly && isReadOnly(f.name)) {
      skipped.push(f)
    } else {
      auditable.push(f)
    }
  }

  const actionOwner = new Map<number, string>()
  for (const a of actions) {
    let owner: string | null = null
    for (const f of funcs) {
      if (f.index < a.index) {
        owner = f.name
      } else {
        break
      }
    }
    if (owner) {
      actionOwner.set(a.index, owner)
    }
  }

  const auditableNames = new Set(auditable.map((f) => f.name))
  const coveredSet = new Set([...actionOwner.values()].filter((name) => auditableNames.has(name)))
  const covered = coveredSet.size
  const uncovered = auditable.filter((f) => !coveredSet.has(f.name))
  const total = auditable.length
  const pct = total === 0 ? '100.0' : ((covered / total) * 100).toFixed(1)

  const actionsList: { name: string; action: string }[] = []
  for (const f of auditable) {
    const a = actions.find((act) => actionOwner.get(act.index) === f.name)
    if (a) actionsList.push({ name: f.name, action: a.action })
  }

  return {
    file: relative(root, filePath),
    total: funcs.length,
    auditTotal: total,
    covered,
    pct,
    skipped: skipped.map((f) => ({ name: f.name, line: f.line })),
    uncovered: uncovered.map((f) => ({ name: f.name, line: f.line })),
    actions: actionsList,
  }
}

function printReport(results: FileResult[]) {
  const [serviceResults, providerResults] = [
    results.filter((r) => r.file.includes('domain' + sep + 'services')),
    results.filter((r) => r.file.includes('infrastructure' + sep + 'providers')),
  ]

  let totalOps = 0
  let totalCovered = 0
  let totalSkipped = 0

  console.log(`\n${'='.repeat(72)}`)
  console.log(`  LOG COVERAGE REPORT`)
  console.log(`  Branch: hf-377`)
  console.log(`  ${new Date().toISOString().split('T')[0]}`)
  console.log(`${'='.repeat(72)}`)

  for (const [label, group] of [['📦 Domain Services', serviceResults] as const, ['🔌 Infrastructure Providers', providerResults] as const]) {
    console.log(`\n  ${label}`)
    console.log(`  ${'─'.repeat(50)}`)

    for (const r of group) {
      totalOps += r.auditTotal
      totalCovered += r.covered
      totalSkipped += r.skipped.length

      const icon = r.pct === '100.0' ? '✅' : r.auditTotal === 0 ? '⬜' : '⚠️'
      console.log(`  ${icon} ${r.file}`)
      console.log(`     ${r.covered}/${r.auditTotal} operations covered (${r.pct}%)`)
      if (r.skipped.length > 0) {
        console.log(`     ➖ skipped (read-only): ${r.skipped.map((s) => s.name).join(', ')}`)
      }
      if (r.uncovered.length > 0) {
        for (const u of r.uncovered) {
          console.log(`     ❌  ${u.name} (line ${u.line})`)
        }
      }
      if (r.actions.length > 0) {
        for (const a of r.actions) {
          console.log(`     ✅  ${a.name} → ${a.action}`)
        }
      }
      console.log()
    }

    const subCovered = group.reduce((s, r) => s + r.covered, 0)
    const subTotal = group.reduce((s, r) => s + r.auditTotal, 0)
    const subPct = subTotal === 0 ? '100.0' : ((subCovered / subTotal) * 100).toFixed(1)
    const allOk = group.every((r) => r.pct === '100.0' || r.auditTotal === 0)
    console.log(`  ${allOk ? '✅' : '📊'} Subtotal: ${subCovered}/${subTotal} (${subPct}%)`)
    console.log()
  }

  const overall = totalOps === 0 ? 0 : (totalCovered / totalOps) * 100
  console.log(`  ${'='.repeat(50)}`)
  console.log(`  📊 OVERALL: ${totalCovered}/${totalOps} audit operations (${overall.toFixed(1)}%)`)
  console.log(`     (+ ${totalSkipped} read-only operations excluded)`)
  console.log(`  ${'='.repeat(50)}`)

  const missing = totalOps - totalCovered
  if (missing > 0) {
    console.log(`\n  🎯 Target: 100%`)
    console.log(`  Missing: ${missing} operations without action logs`)
  }
  console.log()
}

const sep = /^win/.test(process.platform) ? '\\' : '/'

function main() {
  const serviceDir = resolve(src, 'domain', 'services')
  const providerDir = resolve(src, 'infrastructure', 'providers')

  const results: FileResult[] = []

  for (const dir of [serviceDir, providerDir]) {
    const skipReadonly = dir === serviceDir
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.endsWith('.types.ts'))
    for (const file of files.sort()) {
      results.push(computeCoverage(resolve(dir, file), skipReadonly))
    }
  }

  printReport(results)
}

main()
