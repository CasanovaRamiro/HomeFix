import { readFileSync, readdirSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..', 'test')

function walk(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full).forEach(f => files.push(f))
    else if (entry.isFile() && entry.name.endsWith('.test.ts')) files.push(full)
  }
  return files
}

function extractBlock(content, startIdx) {
  let depth = 0
  let inBody = false
  let bodyStart = -1
  let bodyEnd = -1
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i]
    if (ch === '{') {
      if (!inBody) { inBody = true; bodyStart = i }
      depth++
    } else if (ch === '}') {
      depth--
      if (inBody && depth === 0) { bodyEnd = i; break }
    }
  }
  return bodyStart >= 0 && bodyEnd > bodyStart ? content.slice(bodyStart + 1, bodyEnd) : ''
}

function extractBeforeEachBlocks(content) {
  const blocks = []
  const regex = /\b(beforeEach|beforeAll)\s*\(\s*(async\s*)?\(?\s*(?:[^)]*?)\)?\s*=>\s*/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const startIdx = match.index + match[0].length
    const body = extractBlock(content, startIdx)
    if (body) blocks.push(body)
  }
  return blocks
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const tests = []
  const itRegex = /\bit\s*\(\s*(['"`])(.+?)\1\s*,/g
  let match
  while ((match = itRegex.exec(content)) !== null) {
    const name = match[2]
    const startIdx = match.index + match[0].length
    const body = extractBlock(content, startIdx)
    tests.push({ name, body, file: relative(ROOT, filePath) })
  }

  return {
    tests,
    beforeEachBlocks: extractBeforeEachBlocks(content),
    hasGlobalMocks: content.includes('vi.mock('),
  }
}

function classify(name) {
  const lower = name.toLowerCase()
  if (/^should\s/.test(lower)) return 'should'
  if (/^returns?\s/.test(lower)) return 'returns'
  if (/^throw(s|ing)?\s/.test(lower)) return 'throws'
  return 'other'
}

function hasArrange(body) {
  return /vi\.mocked\(|\.mockResolvedValue\(|\.mockResolvedValueOnce\(|\.mockRejectedValue\(|\.mockReturnValue\(|\.mockImplementation\(|vi\.spyOn\(|\.mockReturnThis\(/.test(body)
}

function hasAct(body) {
  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'))
  // Look for the primary function call pattern: variable assignment, await call, or bare function call
  return lines.some(l => {
    if (/^expect\(/.test(l)) return false
    if (/^vi\./.test(l)) return false
    if (/^(beforeEach|afterEach|describe|import|it\s*\()/.test(l)) return false
    // Pattern: const/let x = [await] someCall(...)
    // Pattern: [await] someCall(...)
    // Pattern: x.y.z = ... (property assignment like req.body = ...)
    if (/\bawait\s+\w+/.test(l)) return true
    if (/^(const|let|var)\s+\w+\s*=/.test(l) && /\(/.test(l)) return true
    if (/^\w[\w.]*\s*\(/.test(l)) return true
    // Route tests: request(app).get/post/...
    if (/\brequest\s*\(/.test(l)) return true
    return false
  })
}

function hasAssert(body) {
  return /\bexpect\s*\(/.test(body)
}

// Arrange patterns valid both inside it() and beforeEach()
function hasArrangeInBlock(body) {
  return /vi\.mocked\(|\.mockResolvedValue\(|\.mockResolvedValueOnce\(|\.mockRejectedValue\(|\.mockReturnValue\(|\.mockImplementation\(|vi\.spyOn\(|\.mockReturnThis\(/.test(body)
}

function hasArrangeInBlockData(body) {
  return /await\s+create\w+\(|await\s+cleanDb\(|\bprisma\.\w+\.create\(/.test(body)
}

// --- Main ---
const files = walk(ROOT)
let total = 0
const counts = { should: 0, returns: 0, throws: 0, other: 0 }
let aaaArrange = 0, aaaAct = 0, aaaAssert = 0
const examples = { should: '', returns: '', throws: '', other: '' }
const layerStats = { service: { total: 0, arrange: 0, act: 0, assert: 0 }, data: { total: 0, arrange: 0, act: 0, assert: 0 }, routes: { total: 0, arrange: 0, act: 0, assert: 0 }, middleware: { total: 0, arrange: 0, act: 0, assert: 0 }, providers: { total: 0, arrange: 0, act: 0, assert: 0 }, infrastructure: { total: 0, arrange: 0, act: 0, assert: 0 }, other: { total: 0, arrange: 0, act: 0, assert: 0 } }

function getLayer(filePath) {
  const rel = relative(ROOT, filePath)
  const parts = rel.split(/[\\\/]/)
  return parts[0] || 'other'
}

for (const file of files) {
  const { tests, beforeEachBlocks, hasGlobalMocks } = scanFile(file)
  const layer = getLayer(file)

  // Does the file have arrange in beforeEach or global mocks?
  const fileHasArrange = hasGlobalMocks || beforeEachBlocks.some(b => hasArrangeInBlock(b) || hasArrangeInBlockData(b))

  for (const t of tests) {
    total++
    const cat = classify(t.name)
    counts[cat]++
    if (!examples[cat] && t.name.length < 80) examples[cat] = `${t.name}  (${t.file}:${findLine(file, t.name)})`

    const arr = hasArrangeInBlock(t.body) || fileHasArrange
    const act = hasAct(t.body)
    const ass = hasAssert(t.body)
    if (arr) aaaArrange++
    if (act) aaaAct++
    if (ass) aaaAssert++

    if (layerStats[layer]) {
      layerStats[layer].total++
      if (arr) layerStats[layer].arrange++
      if (act) layerStats[layer].act++
      if (ass) layerStats[layer].assert++
    } else {
      layerStats.other.total++
      if (arr) layerStats.other.arrange++
      if (act) layerStats.other.act++
      if (ass) layerStats.other.assert++
    }
  }
}

function findLine(file, name) {
  const content = readFileSync(file, 'utf-8')
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(name)) return i + 1
  }
  return 0
}

// --- Report ---
const bar = (n, total) => {
  const width = 30
  const filled = Math.round((n / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const pct = (n, total) => ((n / total) * 100).toFixed(1)

console.log()
console.log('╔═══════════════════════════════════════════════╗')
console.log('║     Server Test Semantics Report              ║')
console.log('╚═══════════════════════════════════════════════╝')
console.log()
console.log(`  Total tests: ${total}`)
console.log()

console.log('  ── Naming Patterns ──')
for (const cat of ['should', 'returns', 'throws', 'other']) {
  console.log(`  ${cat.padEnd(8)} ${bar(counts[cat], total)}  ${counts[cat]}  (${pct(counts[cat], total)}%)`)
}
console.log()

  console.log('  ── AAA Implicit Structure ──')
  console.log(`  ✅ Arrange (mocks/setup):  ${aaaArrange}/${total}  (${pct(aaaArrange, total)}%)`)
  console.log(`  ✅ Act (function call):    ${aaaAct}/${total}  (${pct(aaaAct, total)}%)`)
  console.log(`  ✅ Assert (expect):        ${aaaAssert}/${total}  (${pct(aaaAssert, total)}%)`)
  console.log()
  console.log('  ── AAA by Layer ──')
  for (const [layer, s] of Object.entries(layerStats)) {
    if (s.total === 0) continue
    const arrPct = pct(s.arrange, s.total)
    const actPct = pct(s.act, s.total)
    const assPct = pct(s.assert, s.total)
    console.log(`  ${layer.padEnd(14)} ${String(s.total).padStart(4)} tests  │ A:${arrPct.padStart(5)}%  Act:${actPct.padStart(5)}%  Assert:${assPct.padStart(5)}%`)
  }
  console.log()

console.log('  ── Examples by Pattern ──')
for (const cat of ['should', 'returns', 'throws', 'other']) {
  if (examples[cat]) console.log(`  ${cat.padEnd(8)} "${examples[cat]}"`)
}
console.log()
