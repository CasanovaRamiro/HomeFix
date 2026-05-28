import prisma from '../src/lib/prisma.js'
import * as bcrypt from 'bcryptjs'

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  // 1. Asegurar que las categorías existan siempre
  const categories = [
    'Plomeria',
    'Electricidad',
    'Carpinteria',
    'Instalador de aire acondicionado',
    'Pintura',
    'Albanileria',
    'Cerrajeria',
    'Climatizacion',
    'Gas'
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log('Categories synchronized')

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

  const catPlomeria = await prisma.category.create({ data: { name: 'Plomeria' } })
  const catElect = await prisma.category.create({ data: { name: 'Electricidad' } })
  const catCarpinteria = await prisma.category.create({ data: { name: 'Carpinteria' } })
  const catAire = await prisma.category.create({ data: { name: 'Instalador de aire acondicionado' } })
  const catPintura = await prisma.category.create({ data: { name: 'Pintura' } })
  const catAlbanil = await prisma.category.create({ data: { name: 'Albanileria' } })
  const catCerrajeria = await prisma.category.create({ data: { name: 'Cerrajeria' } })
  const catClima = await prisma.category.create({ data: { name: 'Climatizacion' } })
  const catGas = await prisma.category.create({ data: { name: 'Gas' } })

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

  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: post1.id,
      status: 'Aceptada',
      createdAt: new Date('2026-05-08'),
    },
  })

  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: post2.id,
      status: 'Aceptada',
      createdAt: new Date('2026-05-06'),
    },
  })

  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: post3.id,
      status: 'Rechazada',
      createdAt: new Date('2026-05-04'),
    },
  })

  await prisma.jobApplication.create({
    data: {
      workerId: trabajador.id,
      postId: post4.id,
      status: 'Aceptada',
      createdAt: new Date('2026-05-02'),
    },
  })

  console.log('Created postulaciones')
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
