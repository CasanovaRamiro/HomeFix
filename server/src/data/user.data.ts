import prisma from '../lib/prisma.js'

const publicFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} as const

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } })

export const findAll = () =>
  prisma.user.findMany({ select: publicFields })

const createDefaultDeps = async () => {
  const dni = await prisma.nationalIdType.upsert({
    where: { id: 'default-dni-id' },
    update: {},
    create: { id: 'default-dni-id', description: 'DNI' },
  })
  const addr = await prisma.address.upsert({
    where: { id: 'default-addr-id' },
    update: {},
    create: { id: 'default-addr-id', street: '', number: '0', city: '', state: '' },
  })
  return { dniId: dni.id, addrId: addr.id }
}

interface CreateUserInput {
  name: string
  email: string
  password: string
  phone?: string
  surname?: string
  nationalId?: string
  role?: string
}

export const createUser = async (data: CreateUserInput) => {
  const { dniId, addrId } = await createDefaultDeps()
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone ?? null,
      surname: data.surname ?? '',
      nationalId: data.nationalId ?? `${Date.now()}`,
      nationalIdTypeId: dniId,
      addressId: addrId,
      role: data.role ?? 'user',
    },
    select: publicFields,
  })
}

export const addUserCategories = async (userId: string, categoryIds: string[]) => {
  return prisma.userCategory.createMany({
    data: categoryIds.map(categoryId => ({
      userId,
      categoryId
    }))
  })
}
