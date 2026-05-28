import prisma from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)
  const existingUser = await prisma.user.findUnique({ where: { email: 'trabajador@homefix.com' } })
  if (existingUser) {
    const extraPost = await prisma.post.findFirst({ where: { title: 'Reparación de instalación eléctrica' } })
    if (!extraPost) {
      const catElect = await prisma.category.findUnique({ where: { name: 'Electricidad' } })
      const cliente3 = await prisma.user.findUnique({ where: { email: 'laura@example.com' } })
      if (catElect && cliente3) {
        const post5 = await prisma.post.create({
          data: {
            userId: cliente3.id,
            title: 'Reparación de instalación eléctrica',
            description: 'Se cortó la luz en toda la casa. Necesito un electricista que revise el tablero y repare el circuito dañado. Incluye materiales.',
            address: 'Caballito, Buenos Aires',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-06-02'),
            status: 'Active',
            categories: { create: { categoryId: catElect.id } },
          },
        })
        await prisma.postImage.create({
          data: { url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b0?w=800', postId: post5.id },
        })
        await prisma.postImage.create({
          data: { url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', postId: post5.id },
        })
        console.log('Added extra post + missing images')
      }
    }
    console.log('Seed data already exists, skipping...')
    return
  }

  const trabajador = await prisma.user.create({
    data: {
      name: 'Carlos Gómez',
      email: 'trabajador@homefix.com',
      password: hashedPassword,
      phone: '11-5555-0101',
      role: 'trabajador',
    },
  })
  console.log(`Created worker: ${trabajador.id} - ${trabajador.name}`)

  const cliente1 = await prisma.user.create({
    data: {
      name: 'Marta Ocampo',
      email: 'marta@example.com',
      password: hashedPassword,
      phone: '11-5555-0102',
      role: 'cliente',
    },
  })

  const cliente2 = await prisma.user.create({
    data: {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: hashedPassword,
      phone: '11-5555-0103',
      role: 'cliente',
    },
  })

  const cliente3 = await prisma.user.create({
    data: {
      name: 'Laura Martínez',
      email: 'laura@example.com',
      password: hashedPassword,
      phone: '11-5555-0104',
      role: 'cliente',
    },
  })

  const cliente4 = await prisma.user.create({
    data: {
      name: 'Roberto Sánchez',
      email: 'roberto@example.com',
      password: hashedPassword,
      phone: '11-5555-0105',
      role: 'cliente',
    },
  })

  console.log('Created client users')

  const catPlomeria = await prisma.category.create({ data: { name: 'Plomería' } })
  const catElect = await prisma.category.create({ data: { name: 'Electricidad' } })
  const catGas = await prisma.category.create({ data: { name: 'Gas' } })
  const catAlbanil = await prisma.category.create({ data: { name: 'Albañilería' } })

  const post1 = await prisma.post.create({
    data: {
      userId: cliente1.id,
      title: 'Reparación de tuberías en cocina',
      description: 'Se necesita reparar fuga de agua debajo de la pileta de la cocina.',
      address: 'Recoleta, Buenos Aires',
      startDate: new Date('2026-05-15'),
      endDate: new Date('2026-05-16'),
      status: 'Active',
      categories: { create: { categoryId: catPlomeria.id } },
    },
  })

  const post2 = await prisma.post.create({
    data: {
      userId: cliente2.id,
      title: 'Destape de cañería en baño',
      description: 'El lavabo del baño principal está tapado.',
      address: 'Palermo, Buenos Aires',
      startDate: new Date('2026-05-10'),
      endDate: new Date('2026-05-11'),
      status: 'Active',
      categories: { create: { categoryId: catPlomeria.id } },
    },
  })

  const post3 = await prisma.post.create({
    data: {
      userId: cliente3.id,
      title: 'Instalación de calefón a gas',
      description: 'Cambiar calefón viejo por uno nuevo.',
      address: 'Villa Crespo, Buenos Aires',
      startDate: new Date('2026-05-20'),
      endDate: new Date('2026-05-21'),
      status: 'Active',
      categories: { create: { categoryId: catGas.id } },
    },
  })

  const post4 = await prisma.post.create({
    data: {
      userId: cliente4.id,
      title: 'Cambio de grifería completa en baño',
      description: 'Renovar toda la grifería del baño principal.',
      address: 'Belgrano, Buenos Aires',
      startDate: new Date('2026-05-08'),
      endDate: new Date('2026-05-09'),
      status: 'Active',
      categories: { create: { categoryId: catPlomeria.id } },
    },
  })

  const post5 = await prisma.post.create({
    data: {
      userId: cliente3.id,
      title: 'Reparación de instalación eléctrica',
      description: 'Se cortó la luz en toda la casa. Necesito un electricista que revise el tablero y repare el circuito dañado. Incluye materiales.',
      address: 'Caballito, Buenos Aires',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-02'),
      status: 'Active',
      categories: { create: { categoryId: catElect.id } },
    },
  })

  await prisma.postImage.createMany({
    data: [
      { url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', postId: post1.id },
      { url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800', postId: post2.id },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', postId: post3.id },
      { url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c9?w=800', postId: post4.id },
      { url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b0?w=800', postId: post5.id },
    ],
  })

  console.log('Created post images')
  console.log('Created job posts')

  await prisma.postulacion.create({
    data: {
      trabajadorId: trabajador.id,
      postId: post1.id,
      estado: 'Aceptada',
      createdAt: new Date('2026-05-08'),
    },
  })

  await prisma.postulacion.create({
    data: {
      trabajadorId: trabajador.id,
      postId: post2.id,
      estado: 'Aceptada',
      createdAt: new Date('2026-05-06'),
    },
  })

  await prisma.postulacion.create({
    data: {
      trabajadorId: trabajador.id,
      postId: post3.id,
      estado: 'Rechazada',
      createdAt: new Date('2026-05-04'),
    },
  })

  await prisma.postulacion.create({
    data: {
      trabajadorId: trabajador.id,
      postId: post4.id,
      estado: 'Aceptada',
      createdAt: new Date('2026-05-02'),
    },
  })

  console.log('Created postulaciones')
  console.log('Seed completed successfully!')


const prisma = new PrismaClient()

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
      nationalId: '30111222',
      nationalIdTypeId: dni.id,
      addressId: addressRecoleta.id,
      role: 'user',
      phone: '+541112223344',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Carlos',
      surname: 'Mendez',
      email: 'trabajador@test.com',
      password: passwordHash,
      nationalId: '28123456',
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

  for (const item of posts) {
    const category = categoryByName.get(item.category)
    if (!category) throw new Error(`Missing category: ${item.category}`)

    await prisma.post.create({
      data: {
        title: item.title,
        description: item.description,
        startDate: item.from,
        endDate: item.until,
        address: item.address,
        status: 'Active',
        image: PLACEHOLDER_PHOTO,
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
  }

  console.log('Seed OK')
  console.log(' Datos de prueba distribuidos geográficamente en CABA, Oeste, Norte y Sur.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())