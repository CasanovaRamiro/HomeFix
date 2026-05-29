import prisma from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'

const SEED_PASSWORD = 'test1234'
const PLACEHOLDER_PHOTO =
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80'

async function clean() {
  await prisma.postCategory.deleteMany()
  await prisma.post.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.address.deleteMany()
  await prisma.nationalIdType.deleteMany()
}

async function main() {
  await clean()

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)

  // 1. Tipo de documento
  const dni = await prisma.nationalIdType.create({
    data: { description: 'DNI' },
  })

  // 2. Direcciones base para los usuarios
  const addressPalermo = await prisma.address.create({
    data: { street: 'Av. Santa Fe', number: '3200', city: 'Buenos Aires', state: 'CABA' },
  })

  const addressRecoleta = await prisma.address.create({
    data: { street: 'Av. Callao', number: '1500', city: 'Buenos Aires', state: 'CABA' },
  })

  // 3. Crear Usuarios (IDs autoincrementales numéricos)
  const cliente = await prisma.user.create({
    data: {
      name: 'Maria',
      surname: 'Gonzalez',
      email: 'cliente@test.com',
      password: passwordHash,
      nationalIdTypeId: dni.id,
      addressId: addressRecoleta.id,
      role: 'user',
      phone: '+541112223344',
    },
  })

  const trabajador = await prisma.user.create({
    data: {
      name: 'Carlos',
      surname: 'Mendez',
      email: 'trabajador@test.com',
      password: passwordHash,
      nationalIdTypeId: dni.id,
      addressId: addressPalermo.id,
      role: 'worker',
      phone: '+541198765432',
    },
  })

  // 4. Categorías
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electricista' } }),
    prisma.category.create({ data: { name: 'Plomero' } }),
    prisma.category.create({ data: { name: 'Gasista' } }),
  ])
  const categoryByName = new Map(categories.map((category) => [category.name, category]))

  const jobDates = [
    { from: new Date('2026-05-15'), until: new Date('2026-05-16') },
    { from: new Date('2026-05-10'), until: new Date('2026-05-11') },
    { from: new Date('2026-05-20'), until: new Date('2026-05-22') },
    { from: new Date('2026-06-01'), until: new Date('2026-06-02') },
    { from: new Date('2026-06-05'), until: new Date('2026-06-06') },
  ]

  // 5. Publicaciones Geolocalizadas en el AMBA (coordenadas reales)
  const posts = [
    // --- CABA ---
    {
      title: 'Instalar spots LED - Palermo (CABA)',
      description: 'Necesito instalar 6 spots LED empotrables en la cocina. El techo es de durlock.',
      category: 'Electricista',
      address: 'Palermo, CABA',
      latitude: -34.5889,
      longitude: -58.4306,
      ...jobDates[0],
    },
    {
      title: 'Cambio de llave termomagnética - Belgrano (CABA)',
      description: 'Se quema la llave térmica general cada vez que enchufo el horno.',
      category: 'Electricista',
      address: 'Belgrano, CABA',
      latitude: -34.5631,
      longitude: -58.4556,
      ...jobDates[1],
    },
    {
      title: 'Reparar pérdida de agua en baño - Almagro (CABA)',
      description: 'El tanque del inodoro pierde agua constantemente. Necesito cambiar válvula.',
      category: 'Plomero',
      address: 'Almagro, CABA',
      latitude: -34.6045,
      longitude: -58.4212,
      ...jobDates[2],
    },
    {
      title: 'Colocar calefón tiro balanceado - Caballito (CABA)',
      description: 'Compré un calefón nuevo a gas y necesito que lo instalen y conecten.',
      category: 'Gasista',
      address: 'Caballito, CABA',
      latitude: -34.6196,
      longitude: -58.4457,
      ...jobDates[3],
    },

    // --- Zona Oeste ---
    {
      title: 'Revisar tablero - San Justo (Zona Oeste)',
      description: 'El tablero salta seguido. Cerca de la Universidad Nacional de La Matanza.',
      category: 'Electricista',
      address: 'San Justo, Buenos Aires',
      latitude: -34.6703,
      longitude: -58.5628,
      ...jobDates[1],
    },
    {
      title: 'Cambiar cableado - Ramos Mejía (Zona Oeste)',
      description: 'Cambio de cables viejos y térmicas en departamento de 2 ambientes.',
      category: 'Electricista',
      address: 'Ramos Mejía, Buenos Aires',
      latitude: -34.6436,
      longitude: -58.5639,
      ...jobDates[2],
    },
    {
      title: 'Destapar cañería - Morón (Zona Oeste)',
      description: 'Urgente plomero para destapar la bacha principal de la cocina.',
      category: 'Plomero',
      address: 'Morón, Buenos Aires',
      latitude: -34.6514,
      longitude: -58.6212,
      ...jobDates[0],
    },
    {
      title: 'Instalar termotanque - Castelar (Zona Oeste)',
      description: 'Compré un termotanque eléctrico de 80L y necesito instalación con soporte.',
      category: 'Plomero',
      address: 'Castelar, Buenos Aires',
      latitude: -34.6482,
      longitude: -58.6481,
      ...jobDates[4],
    },

    // --- Zona Sur ---
    {
      title: 'Fuga de agua - Avellaneda (Zona Sur)',
      description: 'Tengo una filtración en la pared del baño, necesito romper y reparar caño.',
      category: 'Plomero',
      address: 'Avellaneda, Buenos Aires',
      latitude: -34.6622,
      longitude: -58.3653,
      ...jobDates[1],
    },
    {
      title: 'Puesta a tierra - Lanús (Zona Sur)',
      description: 'Necesito que alguien haga la jabalina y conexión a tierra de toda la casa.',
      category: 'Electricista',
      address: 'Lanús, Buenos Aires',
      latitude: -34.6939,
      longitude: -58.3961,
      ...jobDates[3],
    },
    {
      title: 'Arreglar pérdida en junta - Lomas de Zamora (Zona Sur)',
      description: 'La junta del inodoro pierde y mancha el piso del baño.',
      category: 'Plomero',
      address: 'Lomas de Zamora, Buenos Aires',
      latitude: -34.7619,
      longitude: -58.4056,
      ...jobDates[2],
    },

    // --- Zona Norte ---
    {
      title: 'Instalación de Estufa - Martínez (Zona Norte)',
      description: 'Colocación de tiro balanceado con su correspondiente ventilación al exterior.',
      category: 'Gasista',
      address: 'Martínez, Buenos Aires',
      latitude: -34.4947,
      longitude: -58.5094,
      ...jobDates[2],
    },
    {
      title: 'Cortocircuito en llaves - San Isidro (Zona Norte)',
      description: 'Cada vez que llueve salta la térmica del circuito de enchufes.',
      category: 'Electricista',
      address: 'San Isidro, Buenos Aires',
      latitude: -34.4701,
      longitude: -58.5189,
      ...jobDates[0],
    },
    {
      title: 'Reparar calefactor - Vicente López (Zona Norte)',
      description: 'El piloto del calefactor no se enciende. Posible suciedad en el inyector.',
      category: 'Gasista',
      address: 'Vicente López, Buenos Aires',
      latitude: -34.5296,
      longitude: -58.4750,
      ...jobDates[4],
    },
  ]

  const createdPostIds: string[] = []

  for (const item of posts) {
    const category = categoryByName.get(item.category)
    if (!category) throw new Error(`Missing category: ${item.category}`)

    const post = await prisma.post.create({
      data: {
        title: item.title,
        description: item.description,
        startDate: item.from,
        endDate: item.until,
        address: item.address,
        status: 'Active',
        images: { create: { url: PLACEHOLDER_PHOTO } },
        latitude: item.latitude,
        longitude: item.longitude,
        userId: cliente.id,
        categories: {
          create: {
            categoryId: category.id,
          },
        },
      },
    })
    createdPostIds.push(post.id)
  }

  // Postulaciones de ejemplo
  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: createdPostIds[0],
      status: 'Aceptada',
      createdAt: new Date('2026-05-08'),
    },
  })

  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: createdPostIds[1],
      status: 'Aceptada',
      createdAt: new Date('2026-05-06'),
    },
  })

  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: createdPostIds[2],
      status: 'Rechazada',
      createdAt: new Date('2026-05-04'),
    },
  })

  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: createdPostIds[3],
      status: 'Aceptada',
      createdAt: new Date('2026-05-02'),
    },
  })

  console.log('Seed OK')
  console.log(' Datos de prueba distribuidos geográficamente en CABA, Oeste, Norte y Sur.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())