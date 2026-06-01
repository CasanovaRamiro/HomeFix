import prisma from '../src/lib/prisma.js'
import * as bcrypt from 'bcryptjs'

const SEED_PASSWORD = 'test1234'

const JOB_IMAGES: Record<string, string[]> = {
  Electricista: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
  ],
  Plomero: [
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
    'https://images.unsplash.com/photo-1504148455328-c376907d9e1a?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80',
  ],
  Gasista: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80',
  ],
}

async function clean() {
  await prisma.postCategory.deleteMany()
  await prisma.postImage.deleteMany()
  await prisma.post.deleteMany()
  await prisma.category.deleteMany()
  await prisma.userCategory.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.workerReview.deleteMany()
  await prisma.application.deleteMany()
  await prisma.user.deleteMany()
  await prisma.address.deleteMany()
  await prisma.nationalIdType.deleteMany()
}

async function main() {
  await clean()

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)

  // Tipo de documento
  const dni = await prisma.nationalIdType.create({
    data: { description: 'DNI' },
  })

  // Direcciones para clientes (distintas localidades de Buenos Aires)
  const addressRecoleta = await prisma.address.create({
    data: { street: 'Av. Callao', number: '1500', city: 'Buenos Aires', state: 'CABA' },
  })
  const addressBelgrano = await prisma.address.create({
    data: { street: 'Av. Cabildo', number: '1200', city: 'Buenos Aires', state: 'CABA' },
  })
  const addressAlmagro = await prisma.address.create({
    data: { street: 'Av. Rivadavia', number: '4500', city: 'Buenos Aires', state: 'CABA' },
  })
  const addressCaballito = await prisma.address.create({
    data: { street: 'Av. Acoyte', number: '300', city: 'Buenos Aires', state: 'CABA' },
  })
  const addressPalermo = await prisma.address.create({
    data: { street: 'Av. Santa Fe', number: '3200', city: 'Buenos Aires', state: 'CABA' },
  })
  const addressSanJusto = await prisma.address.create({
    data: { street: 'Av. de Mayo', number: '800', city: 'San Justo', state: 'Buenos Aires' },
  })
  const addressRamosMejia = await prisma.address.create({
    data: { street: 'Av. Rivadavia', number: '13000', city: 'Ramos Mejía', state: 'Buenos Aires' },
  })
  const addressMoron = await prisma.address.create({
    data: { street: 'San Martín', number: '500', city: 'Morón', state: 'Buenos Aires' },
  })
  const addressCastelar = await prisma.address.create({
    data: { street: 'Av. de la Libertad', number: '600', city: 'Castelar', state: 'Buenos Aires' },
  })
  const addressAvellaneda = await prisma.address.create({
    data: { street: 'Av. Mitre', number: '900', city: 'Avellaneda', state: 'Buenos Aires' },
  })
  const addressLanus = await prisma.address.create({
    data: { street: 'Av. Hipólito Yrigoyen', number: '4000', city: 'Lanús', state: 'Buenos Aires' },
  })
  const addressLomas = await prisma.address.create({
    data: { street: 'Manuel Castro', number: '300', city: 'Lomas de Zamora', state: 'Buenos Aires' },
  })
  const addressMartinez = await prisma.address.create({
    data: { street: 'Av. Santa Fe', number: '2200', city: 'Martínez', state: 'Buenos Aires' },
  })
  const addressSanIsidro = await prisma.address.create({
    data: { street: 'Av. del Libertador', number: '16000', city: 'San Isidro', state: 'Buenos Aires' },
  })
  const addressVicenteLopez = await prisma.address.create({
    data: { street: 'Av. Maipú', number: '2500', city: 'Vicente López', state: 'Buenos Aires' },
  })

  const clients = [
    { name: 'Laura', surname: 'Fernández', email: 'laura@test.com', addressId: addressRecoleta.id },
    { name: 'Sofía', surname: 'Martínez', email: 'sofia@test.com', addressId: addressBelgrano.id },
    { name: 'Diego', surname: 'Ramírez', email: 'diego@test.com', addressId: addressAlmagro.id },
    { name: 'Valentina', surname: 'López', email: 'valentina@test.com', addressId: addressCaballito.id },
    { name: 'Martín', surname: 'García', email: 'martin@test.com', addressId: addressPalermo.id },
    { name: 'Camila', surname: 'Torres', email: 'camila@test.com', addressId: addressSanJusto.id },
    { name: 'Nicolás', surname: 'Pérez', email: 'nicolas@test.com', addressId: addressRamosMejia.id },
    { name: 'Florencia', surname: 'Díaz', email: 'florencia@test.com', addressId: addressMoron.id },
    { name: 'Joaquín', surname: 'Suárez', email: 'joaquin@test.com', addressId: addressCastelar.id },
    { name: 'Agustina', surname: 'Romero', email: 'agustina@test.com', addressId: addressAvellaneda.id },
    { name: 'Mateo', surname: 'Acosta', email: 'mateo@test.com', addressId: addressLanus.id },
    { name: 'Catalina', surname: 'Medina', email: 'catalina@test.com', addressId: addressLomas.id },
    { name: 'Benjamín', surname: 'Castillo', email: 'benjamin@test.com', addressId: addressMartinez.id },
    { name: 'Emilia', surname: 'Giménez', email: 'emilia@test.com', addressId: addressSanIsidro.id },
    { name: 'Facundo', surname: 'Rivas', email: 'facundo@test.com', addressId: addressVicenteLopez.id },
  ]

  const createdClients = await Promise.all(
    clients.map((c: { name: string; surname: string; email: string; addressId: string }) =>
      prisma.user.create({
        data: {
          name: c.name,
          surname: c.surname,
          email: c.email,
          password: passwordHash,
          nationalId: `${Math.floor(10000000 + Math.random() * 90000000)}`,
          nationalIdTypeId: dni.id,
          addressId: c.addressId,
          role: 'user',
          phone: '+5411' + Math.floor(10000000 + Math.random() * 90000000),
        },
      }),
    ),
  )

  const trabajador = await prisma.user.create({
    data: {
      name: 'Carlos',
      surname: 'Mendez',
      email: 'trabajador@test.com',
      password: passwordHash,
      nationalId: '2033344455',
      nationalIdTypeId: dni.id,
      addressId: addressPalermo.id,
      role: 'worker',
      phone: '+541198765432',
    },
  })

  // Categorías
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electricista' } }),
    prisma.category.create({ data: { name: 'Plomero' } }),
    prisma.category.create({ data: { name: 'Gasista' } }),
  ])
  const categoryByName = new Map(
    categories.map((c: { id: string; name: string }) => [c.name, c] as const)
  )

  const jobDates = [
    { from: new Date('2026-05-15'), until: new Date('2026-05-16') },
    { from: new Date('2026-05-10'), until: new Date('2026-05-11') },
    { from: new Date('2026-05-20'), until: new Date('2026-05-22') },
    { from: new Date('2026-06-01'), until: new Date('2026-06-02') },
    { from: new Date('2026-06-05'), until: new Date('2026-06-06') },
  ]

  // 15 publicaciones — una por cada cliente, variando categorías
  const posts = [
    {
      title: 'Instalar spots LED en cocina - Recoleta',
      description: 'Necesito instalar 6 spots LED empotrables en el techo de durlock de la cocina. Las medidas son estándar.',
      category: 'Electricista', address: 'Recoleta, CABA',
      latitude: -34.5889, longitude: -58.3910,
      ...jobDates[0],
    },
    {
      title: 'Cambio de llave termomagnética - Belgrano',
      description: 'La llave térmica general salta cada vez que uso el horno eléctrico. Necesito que la revisen y la cambien.',
      category: 'Electricista', address: 'Belgrano, CABA',
      latitude: -34.5631, longitude: -58.4556,
      ...jobDates[1],
    },
    {
      title: 'Reparar pérdida de agua en baño - Almagro',
      description: 'El tanque del inodoro pierde agua constantemente. Ya cambié la válvula pero sigue perdiendo.',
      category: 'Plomero', address: 'Almagro, CABA',
      latitude: -34.6045, longitude: -58.4212,
      ...jobDates[2],
    },
    {
      title: 'Colocar calefón tiro balanceado - Caballito',
      description: 'Compré un calefón nuevo a gas (tiro balanceado) y necesito que lo instalen y conecten a la salida existente.',
      category: 'Gasista', address: 'Caballito, CABA',
      latitude: -34.6196, longitude: -58.4457,
      ...jobDates[3],
    },
    {
      title: 'Revisar tablero eléctrico - Palermo',
      description: 'El tablero salta seguido sin motivo aparente. Quiero que un electricista revise todas las térmicas y conexiones.',
      category: 'Electricista', address: 'Palermo, CABA',
      latitude: -34.5889, longitude: -58.4306,
      ...jobDates[1],
    },
    {
      title: 'Destapar cañería principal - San Justo',
      description: 'Urgente: la bacha de la cocina no drena. Ya probé con destapador químico pero no funcionó.',
      category: 'Plomero', address: 'San Justo, Buenos Aires',
      latitude: -34.6703, longitude: -58.5628,
      ...jobDates[0],
    },
    {
      title: 'Cambiar cableado completo - Ramos Mejía',
      description: 'Departamento de 2 ambientes con cableado viejo. Necesito cambiar todos los cables y las térmicas.',
      category: 'Electricista', address: 'Ramos Mejía, Buenos Aires',
      latitude: -34.6436, longitude: -58.5639,
      ...jobDates[2],
    },
    {
      title: 'Instalar termotanque eléctrico - Morón',
      description: 'Compré un termotanque eléctrico de 80 litros. Necesito instalación con soporte de pared y conexión.',
      category: 'Plomero', address: 'Morón, Buenos Aires',
      latitude: -34.6514, longitude: -58.6212,
      ...jobDates[4],
    },
    {
      title: 'Reparar calefactor tiro balanceado - Castelar',
      description: 'El piloto del calefactor no se enciende. Creo que tiene suciedad en el inyector.',
      category: 'Gasista', address: 'Castelar, Buenos Aires',
      latitude: -34.6482, longitude: -58.6481,
      ...jobDates[4],
    },
    {
      title: 'Fuga de agua en pared - Avellaneda',
      description: 'Tengo una filtración en la pared del baño. Necesito romper y reparar el caño interno.',
      category: 'Plomero', address: 'Avellaneda, Buenos Aires',
      latitude: -34.6622, longitude: -58.3653,
      ...jobDates[1],
    },
    {
      title: 'Puesta a tierra de toda la casa - Lanús',
      description: 'Necesito la instalación de jabalina y conexión a tierra para toda la vivienda.',
      category: 'Electricista', address: 'Lanús, Buenos Aires',
      latitude: -34.6939, longitude: -58.3961,
      ...jobDates[3],
    },
    {
      title: 'Cambiar junta del inodoro - Lomas de Zamora',
      description: 'La junta del inodoro pierde y mancha el piso. Hay que reemplazar el anillo de cera y ajustar.',
      category: 'Plomero', address: 'Lomas de Zamora, Buenos Aires',
      latitude: -34.7619, longitude: -58.4056,
      ...jobDates[2],
    },
    {
      title: 'Instalación de estufa tiro balanceado - Martínez',
      description: 'Colocación de estufa a gas con salida al exterior. Incluye perforación de pared.',
      category: 'Gasista', address: 'Martínez, Buenos Aires',
      latitude: -34.4947, longitude: -58.5094,
      ...jobDates[2],
    },
    {
      title: 'Cortocircuito en llaves - San Isidro',
      description: 'Cuando llueve salta la térmica del circuito de enchufes. Posible filtraciones en caja.',
      category: 'Electricista', address: 'San Isidro, Buenos Aires',
      latitude: -34.4701, longitude: -58.5189,
      ...jobDates[0],
    },
    {
      title: 'Reparar pérdida de gas - Vicente López',
      description: 'Siento olor a gas cerca del medidor. Necesito revisión urgente de la instalación.',
      category: 'Gasista', address: 'Vicente López, Buenos Aires',
      latitude: -34.5296, longitude: -58.4750,
      ...jobDates[4],
    },
  ]

  const createdPostIds: string[] = []

  for (const [index, item] of posts.entries()) {
    const category = categoryByName.get(item.category)
    if (!category) throw new Error(`Missing category: ${item.category}`)

    const images = JOB_IMAGES[item.category] ?? []
    const imageUrl = images[index % images.length]

    const post = await prisma.post.create({
      data: {
        title: item.title,
        description: item.description,
        startDate: item.from,
        endDate: item.until,
        address: item.address,
        status: 'Active',
        images: { create: { url: imageUrl } },
        latitude: item.latitude,
        longitude: item.longitude,
        userId: createdClients[index % createdClients.length].id,
        categories: {
          create: { categoryId: category.id},
        },
      },
    })
    createdPostIds.push(post.id)
  }

  // Postulaciones de ejemplo
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[0], status: 'Accepted', createdAt: new Date('2026-05-08') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[1], status: 'Accepted', createdAt: new Date('2026-05-06') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[2], status: 'Rejected', createdAt: new Date('2026-05-04') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[3], status: 'Accepted', createdAt: new Date('2026-05-02') },
  })

  console.log('Seed OK')
  console.log(' 15 clientes, 1 trabajador, 15 posts distribuidos en AMBA')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
