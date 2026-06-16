import prisma from '../src/lib/prisma.js'
const MANAGED_PASSWORD = 'AUTH0_MANAGED_ACCOUNT'

const JOB_IMAGES: Record<string, string[]> = {
  Electricidad: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80',
  ],
  Plomería: [
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
    'https://images.unsplash.com/photo-1504148455328-c376907d9e1a?w=800&q=80',
  ],
  Carpintería: [
    'https://images.unsplash.com/photo-1530125724549-b8ec6a5f3ab3?w=800&q=80',
    'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800&q=80',
  ],
  Pintura: [
    'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80',
  ],
  Albañilería: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80',
  ],
  Cerrajería: [
    'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=800&q=80',
    'https://images.unsplash.com/photo-1599658880436-c1f8e1f1a5b1?w=800&q=80',
  ],
  'Aire / HVAC': [
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    'https://images.unsplash.com/photo-1631545806606-38e1c1b8ca15?w=800&q=80',
  ],
  Electrónica: [
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
    'https://images.unsplash.com/photo-1531494391841-6b21c120eefe?w=800&q=80',
  ],
}

async function clean() {
  await prisma.postCategory.deleteMany()
  await prisma.postImage.deleteMany()
  await prisma.post.deleteMany()
  await prisma.category.deleteMany()
  await prisma.userCategory.deleteMany()

  await prisma.workerReview.deleteMany()
  await prisma.application.deleteMany()
  await prisma.user.deleteMany()
  await prisma.address.deleteMany()
  await prisma.nationalIdType.deleteMany()
}

async function main() {
  await clean()

  const passwordHash = MANAGED_PASSWORD

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
    clients.map((c) =>
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

  // Categorías — solo estas 8
  const CATEGORY_NAMES = [
    'Electricidad', 'Plomería', 'Carpintería', 'Pintura',
    'Albañilería', 'Cerrajería', 'Aire / HVAC', 'Electrónica',
  ] as const
  const categories = await Promise.all(
    CATEGORY_NAMES.map((name) => prisma.category.create({ data: { name } })),
  )
  const categoryByName = new Map(categories.map((c) => [c.name, c]))

  const jobDates = [
    { from: new Date('2026-05-15'), until: new Date('2026-05-16') },
    { from: new Date('2026-05-10'), until: new Date('2026-05-11') },
    { from: new Date('2026-05-20'), until: new Date('2026-05-22') },
    { from: new Date('2026-06-01'), until: new Date('2026-06-02') },
    { from: new Date('2026-06-05'), until: new Date('2026-06-06') },
  ]

  // 15 publicaciones — una por cada cliente, variando categorías (cubriendo las 8)
  const posts = [
    {
      title: 'Instalar spots LED en cocina - Recoleta',
      description: 'Necesito instalar 6 spots LED empotrables en el techo de durlock de la cocina. Las medidas son estándar.',
      category: 'Electricidad', address: 'Recoleta, CABA',
      latitude: -34.5889, longitude: -58.3910,
      ...jobDates[0],
    },
    {
      title: 'Cambio de llave termomagnética - Belgrano',
      description: 'La llave térmica general salta cada vez que uso el horno eléctrico. Necesito que la revisen y la cambien.',
      category: 'Electricidad', address: 'Belgrano, CABA',
      latitude: -34.5631, longitude: -58.4556,
      ...jobDates[1],
    },
    {
      title: 'Reparar pérdida de agua en baño - Almagro',
      description: 'El tanque del inodoro pierde agua constantemente. Ya cambié la válvula pero sigue perdiendo.',
      category: 'Plomería', address: 'Almagro, CABA',
      latitude: -34.6045, longitude: -58.4212,
      ...jobDates[2],
    },
    {
      title: 'Colocar estantes de madera - Caballito',
      description: 'Necesito fabricar e instalar 3 estantes flotantes de madera maciza en la pared del living.',
      category: 'Carpintería', address: 'Caballito, CABA',
      latitude: -34.6196, longitude: -58.4457,
      ...jobDates[3],
    },
    {
      title: 'Revisar tablero eléctrico - Palermo',
      description: 'El tablero salta seguido sin motivo aparente. Quiero que un electricista revise todas las térmicas y conexiones.',
      category: 'Electricidad', address: 'Palermo, CABA',
      latitude: -34.5889, longitude: -58.4306,
      ...jobDates[1],
    },
    {
      title: 'Pintar living comedor - San Justo',
      description: 'Quiero pintar el living de 40m². Paredes lisas, color a definir. Incluye materiales.',
      category: 'Pintura', address: 'San Justo, Buenos Aires',
      latitude: -34.6703, longitude: -58.5628,
      ...jobDates[0],
    },
    {
      title: 'Arreglar pared con grietas - Ramos Mejía',
      description: 'Pared con grietas profundas en el living. Necesito revocar y dejar lista para pintar.',
      category: 'Albañilería', address: 'Ramos Mejía, Buenos Aires',
      latitude: -34.6436, longitude: -58.5639,
      ...jobDates[2],
    },
    {
      title: 'Cambiar cilindro de cerradura - Morón',
      description: 'La cerradura principal de la puerta de calle está trabada. Cambio de cilindro urgente.',
      category: 'Cerrajería', address: 'Morón, Buenos Aires',
      latitude: -34.6514, longitude: -58.6212,
      ...jobDates[4],
    },
    {
      title: 'Instalar aire acondicionado split - Castelar',
      description: 'Necesito instalación de split de 3000 frigorías en habitación. Pared de ladrillo vista.',
      category: 'Aire / HVAC', address: 'Castelar, Buenos Aires',
      latitude: -34.6482, longitude: -58.6481,
      ...jobDates[4],
    },
    {
      title: 'Reparar PC de escritorio - Avellaneda',
      description: 'La PC no enciende. Hace un ruido extraño en la fuente. Posible cambio de fuente o placa.',
      category: 'Electrónica', address: 'Avellaneda, Buenos Aires',
      latitude: -34.6622, longitude: -58.3653,
      ...jobDates[1],
    },
    {
      title: 'Cambiar canilla de cocina - Lanús',
      description: 'La canilla de la cocina pierde por la base. Necesito cambiarla por una nueva.',
      category: 'Plomería', address: 'Lanús, Buenos Aires',
      latitude: -34.6939, longitude: -58.3961,
      ...jobDates[3],
    },
    {
      title: 'Reparar mueble de cocina - Lomas de Zamora',
      description: 'La puerta de un mueble bajo de cocina se descolgó. Necesito arreglar bisagras y nivelar.',
      category: 'Carpintería', address: 'Lomas de Zamora, Buenos Aires',
      latitude: -34.7619, longitude: -58.4056,
      ...jobDates[2],
    },
    {
      title: 'Pintar frente de casa - Martínez',
      description: 'Necesito pintar el frente de la casa. Aprox 30m² de pared exterior. Incluye preparación.',
      category: 'Pintura', address: 'Martínez, Buenos Aires',
      latitude: -34.4947, longitude: -58.5094,
      ...jobDates[2],
    },
    {
      title: 'Construir tabique de durlock - San Isidro',
      description: 'Necesito levantar un tabique divisor de 6x2.5m con durlock en un ambiente.',
      category: 'Albañilería', address: 'San Isidro, Buenos Aires',
      latitude: -34.4701, longitude: -58.5189,
      ...jobDates[0],
    },
    {
      title: 'Mantenimiento de aire acondicionado - Vicente López',
      description: 'Limpieza y mantenimiento de 2 splits. Filtros sucios, posible recarga de gas.',
      category: 'Aire / HVAC', address: 'Vicente López, Buenos Aires',
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
          create: { categoryId: category.id },
        },
      },
    })
    createdPostIds.push(post.id)
  }

  // Postulaciones de ejemplo
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[0], status: 'Accepted',  createdAt: new Date('2026-05-08') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[1], status: 'Accepted',  createdAt: new Date('2026-05-06') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[2], status: 'Rejected',  createdAt: new Date('2026-05-04') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[3], status: 'Accepted',  createdAt: new Date('2026-05-02') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[4], status: 'Pending',   createdAt: new Date('2026-05-30') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[5], status: 'Pending',   createdAt: new Date('2026-05-31') },
  })
  await prisma.application.create({
    data: { workerId: trabajador.id, postId: createdPostIds[6], status: 'Completed', createdAt: new Date('2026-04-20') },
  })

  console.log('Seed OK')
  console.log(` 15 clientes, 1 trabajador, ${CATEGORY_NAMES.length} categorías, 15 posts distribuidos en AMBA`)
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
