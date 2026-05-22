import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electricista' } }),
    prisma.category.create({ data: { name: 'Plomero' } }),
  ])
  const categoryByName = new Map(categories.map((category) => [category.name, category]))

  const jobDates = [
    { from: new Date('2026-05-15'), until: new Date('2026-05-16') },
    { from: new Date('2026-05-10'), until: new Date('2026-05-11') },
    { from: new Date('2026-05-20'), until: new Date('2026-05-22') },
    { from: new Date('2026-05-18'), until: new Date('2026-05-19') },
    { from: new Date('2026-05-09'), until: new Date('2026-05-10') },
  ]

  const posts = [
    {
      title: 'Instalar spots LED en cocina',
      description:
        'Necesito instalar 6 spots LED en la cocina. Ya tengo las luces compradas, solo necesito la mano de obra. La cocina tiene falso techo de durlock.',
      category: 'Electricista',
      ...jobDates[0],
    },
    {
      title: 'Revisar tablero electrico',
      description:
        'El tablero salta cada vez que prendo el aire acondicionado. Necesito una revision urgente porque hace mucho calor. El edificio es antiguo.',
      category: 'Electricista',
      ...jobDates[1],
    },
    {
      title: 'Cambiar cableado completo',
      description:
        'Departamento de 2 ambientes con cableado muy viejo (mas de 40 anos). Quiero cambiar todo el cableado y poner llaves termicas nuevas.',
      category: 'Electricista',
      ...jobDates[2],
    },
    {
      title: 'Agregar enchufes',
      description:
        'Necesito agregar 4 enchufes en el living y 2 en el dormitorio. El departamento tiene instalacion electrica relativamente nueva.',
      category: 'Electricista',
      ...jobDates[3],
    },
    {
      title: 'Resolver cortocircuito',
      description:
        'Hay un cortocircuito en una de las habitaciones. No funciona ninguna luz ni enchufe de ese cuarto desde ayer.',
      category: 'Electricista',
      ...jobDates[4],
    },
    {
      title: 'Destapar inodoro',
      description:
        'Se tapo el inodoro de la cocina. Necesito urgente un plomero para destapar y revisar la caneria.',
      category: 'Plomero',
      from: new Date('2026-07-13'),
      until: new Date('2026-07-15'),
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
        address: 'CABA',
        status: 'Active',
        image: PLACEHOLDER_PHOTO,
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
  console.log('  Login trabajador: trabajador@test.com /', SEED_PASSWORD)
  console.log('  Login cliente:    cliente@test.com /', SEED_PASSWORD)
  console.log('  Posts:          5 Electricista + 1 Plomero (status: Active)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
