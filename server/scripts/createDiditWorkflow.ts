import 'dotenv/config'

const API_KEY = process.env.DIDIT_API_KEY
if (!API_KEY) {
  console.error('DIDIT_API_KEY no está configurado en .env')
  console.error('Agregalo a server/.env y volvé a correr el script.')
  process.exit(1)
}

const DIDIT_BASE = 'https://verification.didit.me'

const FEATURES = [
  {
    feature: 'OCR',
    config: {
      documents_allowed: {
        ARG: {
          ID: { enabled: 1, sides: 2 },
        },
      },
    },
  },
  { feature: 'LIVENESS', config: { face_liveness_method: 'PASSIVE' } },
  { feature: 'FACE_MATCH' },
  { feature: 'IP_ANALYSIS' },
] as const

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://api.miapinode.com'

const DRY_RUN = process.argv.includes('--dry-run')

interface DiditWorkflow {
  uuid?: string
  workflow_id?: string
  id?: string
}

const createWorkflow = async (): Promise<string> => {
  const url = `${DIDIT_BASE}/v3/workflows/`
  const body = JSON.stringify({
    workflow_label: 'HomeFix KYC - Worker Onboarding',
    is_desktop_allowed: true,
    features: [...FEATURES],
  })

  if (DRY_RUN) {
    console.log('--- DRY RUN: create workflow ---')
    console.log(`POST ${url}`)
    console.log(`Headers: x-api-key: <api-key>, Content-Type: application/json`)
    console.log(`Body: ${body}`)
    return 'dry-run-no-id'
  }

  console.log('Creando workflow en Didit...')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY!,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`Error creando workflow: ${res.status} ${res.statusText}`)
    if (text) console.error(text)
    process.exit(1)
  }

  const data = (await res.json()) as DiditWorkflow
  const id = data.uuid ?? data.workflow_id ?? data.id
  if (!id) {
    console.error('La respuesta de Didit no incluye uuid/workflow_id/id:', data)
    process.exit(1)
  }
  return id
}

const main = async (): Promise<void> => {
  if (DRY_RUN) {
    console.log('--- MODO DRY RUN: no se hace ninguna llamada a Didit ---\n')
  }

  const workflowId = await createWorkflow()
  console.log(`\nWorkflow creado con id: ${workflowId}`)

  if (!DRY_RUN) {
    console.log(`\nAgregá esta línea a server/.env:\n  DIDIT_WORKFLOW_ID=${workflowId}\n`)
    console.log(
      `Las URLs de retorno NO se configuran en el workflow — se pasan al crear cada session.\n` +
      `El provider las manda automáticamente; la página de retorno es:\n  ${FRONTEND_URL}/kyc?status=...&verificationSessionId=...\n`,
    )
  }

  if (DRY_RUN) {
    console.log('--- FIN DRY RUN: si todo se ve bien, corré el script sin --dry-run ---')
  } else {
    console.log('Listo. Reiniciá el server si lo tenías corriendo para que tome el nuevo workflow_id.')
  }
}

main().catch((e: unknown) => {
  console.error('Error inesperado:', e)
  process.exit(1)
})
