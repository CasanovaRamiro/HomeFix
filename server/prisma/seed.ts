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
  await prisma.publication.deleteMany()
  await prisma.user.deleteMany()
  await prisma.address.deleteMany()
  await prisma.nationalIdType.deleteMany()
}

async function main() {
  await clean()

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)

  const dni = await prisma.nationalIdType.create({
    data: { description: 'DNI' },
  })

  const addressPalermo = await prisma.address.create({
    data: {
      street: 'Av. Santa Fe',
      number: '3200',
      city: 'Buenos Aires',
      state: 'CABA',
    },
  })

  const addressRecoleta = await prisma.address.create({
    data: {
      street: 'Av. Callao',
      number: '1500',
      city: 'Buenos Aires',
      state: 'CABA',
    },
  })

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

  const jobDates = [
    { from: new Date('2026-05-15'), until: new Date('2026-05-15') },
    { from: new Date('2026-05-10'), until: new Date('2026-05-10') },
    { from: new Date('2026-05-20'), until: new Date('2026-05-22') },
    { from: new Date('2026-05-18'), until: new Date('2026-05-18') },
    { from: new Date('2026-05-09'), until: new Date('2026-05-09') },
  ]

  const publications = [
    {
      description:
        'Necesito instalar 6 spots LED en la cocina. Ya tengo las luces compradas, solo necesito la mano de obra. La cocina tiene falso techo de durlock.',
      typePublication: 'Electricista',
      date: new Date('2026-05-08'),
      ...jobDates[0],
    },
    {
      description:
        'El tablero salta cada vez que prendo el aire acondicionado. Necesito una revision urgente porque hace mucho calor. El edificio es antiguo.',
      typePublication: 'Electricista',
      date: new Date('2026-05-09'),
      ...jobDates[1],
    },
    {
      description:
        'Departamento de 2 ambientes con cableado muy viejo (mas de 40 anos). Quiero cambiar todo el cableado y poner llaves termicas nuevas.',
      typePublication: 'Electricista',
      date: new Date('2026-05-07'),
      ...jobDates[2],
    },
    {
      description:
        'Necesito agregar 4 enchufes en el living y 2 en el dormitorio. El departamento tiene instalacion electrica relativamente nueva.',
      typePublication: 'Electricista',
      date: new Date('2026-05-06'),
      ...jobDates[3],
    },
    {
      description:
        'Hay un cortocircuito en una de las habitaciones. No funciona ninguna luz ni enchufe de ese cuarto desde ayer.',
      typePublication: 'Electricista',
      date: new Date('2026-05-09'),
      ...jobDates[4],
    },
    {
      description:
        'Se tapo el inodoro de la cocina. Necesito urgente un plomero para destapar y revisar la cañeria.',
      typePublication: 'Plomero',
      date: new Date('2026-07-12'),
      from: new Date('2026-07-13'),
      until: new Date('2026-07-15'),
    },
  ]

  for (const pub of publications) {
    await prisma.publication.create({
      data: {
        description: pub.description,
        typePublication: pub.typePublication,
        status: 'disponible',
        date: pub.date,
        fromStartJob: pub.from,
        untilFinishJob: pub.until,
        photo: PLACEHOLDER_PHOTO,
        userId: cliente.id,
      },
    })
  }

  console.log('Seed OK')
  console.log('  Login trabajador: trabajador@test.com /', SEED_PASSWORD)
  console.log('  Login cliente:    cliente@test.com /', SEED_PASSWORD)
  console.log('  Publicaciones:  5 Electricista + 1 Plomero (status: disponible)')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
