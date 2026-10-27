import 'dotenv/config'
import prisma from '../src/lib/prisma.js'
import { initializeCategoryCatalog } from '../src/infrastructure/database/categoryCatalog.database.js'

async function main(): Promise<void> {
  const count = await initializeCategoryCatalog(prisma)
  console.log(`Catálogo listo: ${count} categorías agregadas. Se conservaron los datos existentes.`)
}

main()
  .catch((error: unknown) => {
    console.error('No se pudo inicializar el catálogo:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
