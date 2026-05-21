import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
