import 'dotenv/config'
import prisma from '../src/lib/prisma.js'
import { UserRole } from '../src/domain/types/userRole.js'
import { CATEGORY_NAMES } from './categoryCatalog.js'
import { PostType } from '../src/domain/types/postType.js'
import { PostStatus } from '../src/domain/types/postStatus.js'
import { ApplicationStatus } from '../src/domain/types/applicationStatus.js'
import crypto from 'node:crypto'

const MANAGED_PASSWORD = 'AUTH0_MANAGED_ACCOUNT'

// Imágenes MUY acordes por categoría
const POST_IMAGES: Record<string, string[]> = {
  Electricidad: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
  ],
  Plomería: [
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80',
    'https://images.unsplash.com/photo-1504148455328-c376907d9e1a?w=800&q=80',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
  ],
  Carpintería: [
    'https://images.unsplash.com/photo-1530125724549-b8ec6a5f3ab3?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80',
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&q=80',
  ],
  Pintura: [
    'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80',
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
  ],
  Albañilería: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
  ],
  Cerrajería: [
    'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=800&q=80',
    'https://images.unsplash.com/photo-1599658880436-c1f8e1f1a5b1?w=800&q=80',
  ],
  'Aire / HVAC': [
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
    'https://images.unsplash.com/photo-1631545806606-38e1c1b8ca15?w=800&q=80',
    'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80',
  ],
  Electrónica: [
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&q=80',
  ],
}

// Fotos de reseñas - trabajos terminados con resultado visible
const REVIEW_PHOTOS: Record<string, string[]> = {
  Electricidad: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80'],
  Plomería: ['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80', 'https://images.unsplash.com/photo-1504148455328-c376907d9e1a?w=800&q=80'],
  Carpintería: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 'https://images.unsplash.com/photo-1530125724549-b8ec6a5f3ab3?w=800&q=80'],
  Pintura: ['https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80'],
  Albañilería: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80'],
  Cerrajería: ['https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=800&q=80'],
  'Aire / HVAC': ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80'],
  Electrónica: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'],
}

const AVATAR_PHOTOS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80',
]

const WORKER_PHOTOS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
  'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=400&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80',
]

async function clean() {
  await prisma.workerReview.deleteMany()
  await prisma.clientReview.deleteMany()
  await prisma.application.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.postImage.deleteMany()
  await prisma.postCategory.deleteMany()
  await prisma.userCategory.deleteMany()
  await prisma.telegramLinkCode.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
  await prisma.address.deleteMany()
  await prisma.nationalIdType.deleteMany()
  await prisma.category.deleteMany()
}

async function main() {
  await clean()

  const passwordHash = MANAGED_PASSWORD

  const dni = await prisma.nationalIdType.create({ data: { description: 'DNI' } })

  const addresses = await Promise.all([
    prisma.address.create({ data: { street: 'Av. Callao', number: '1500', city: 'Buenos Aires', state: 'CABA' } }),
    prisma.address.create({ data: { street: 'Av. Cabildo', number: '1200', city: 'Buenos Aires', state: 'CABA' } }),
    prisma.address.create({ data: { street: 'Av. Rivadavia', number: '4500', city: 'Buenos Aires', state: 'CABA' } }),
    prisma.address.create({ data: { street: 'Av. Acoyte', number: '300', city: 'Buenos Aires', state: 'CABA' } }),
    prisma.address.create({ data: { street: 'Av. Santa Fe', number: '3200', city: 'Buenos Aires', state: 'CABA' } }),
    prisma.address.create({ data: { street: 'Av. Corrientes', number: '2500', city: 'Buenos Aires', state: 'CABA' } }),
    prisma.address.create({ data: { street: 'Av. Pueyrredón', number: '1800', city: 'Buenos Aires', state: 'CABA' } }),
    prisma.address.create({ data: { street: 'Av. de Mayo', number: '800', city: 'San Justo', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Av. Rivadavia', number: '13000', city: 'Ramos Mejía', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'San Martín', number: '500', city: 'Morón', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Av. de la Libertad', number: '600', city: 'Castelar', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Av. Mitre', number: '900', city: 'Avellaneda', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Av. Hipólito Yrigoyen', number: '4000', city: 'Lanús', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Manuel Castro', number: '300', city: 'Lomas de Zamora', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Av. Santa Fe', number: '2200', city: 'Martínez', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Av. del Libertador', number: '16000', city: 'San Isidro', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Av. Maipú', number: '2500', city: 'Vicente López', state: 'Buenos Aires' } }),
    prisma.address.create({ data: { street: 'Belgrano', number: '150', city: 'Tigre', state: 'Buenos Aires' } }),
  ])

  // Clientes
  const clientData = [
    { name: 'Laura', surname: 'Fernández', email: 'laura.fernandez@test.com', addressIdx: 0 },
    { name: 'Sofía', surname: 'Martínez', email: 'sofia.martinez@test.com', addressIdx: 1 },
    { name: 'Diego', surname: 'Ramírez', email: 'diego.ramirez@test.com', addressIdx: 2 },
    { name: 'Valentina', surname: 'López', email: 'valentina.lopez@test.com', addressIdx: 3 },
    { name: 'Martín', surname: 'García', email: 'martin.garcia@test.com', addressIdx: 4 },
    { name: 'Camila', surname: 'Torres', email: 'camila.torres@test.com', addressIdx: 5 },
    { name: 'Nicolás', surname: 'Pérez', email: 'nicolas.perez@test.com', addressIdx: 6 },
    { name: 'Florencia', surname: 'Díaz', email: 'florencia.diaz@test.com', addressIdx: 7 },
    { name: 'Joaquín', surname: 'Suárez', email: 'joaquin.suarez@test.com', addressIdx: 8 },
    { name: 'Agustina', surname: 'Romero', email: 'agustina.romero@test.com', addressIdx: 9 },
    { name: 'Mateo', surname: 'Acosta', email: 'mateo.acosta@test.com', addressIdx: 10 },
    { name: 'Catalina', surname: 'Medina', email: 'catalina.medina@test.com', addressIdx: 11 },
    { name: 'Benjamín', surname: 'Castillo', email: 'benjamin.castillo@test.com', addressIdx: 12 },
    { name: 'Emilia', surname: 'Giménez', email: 'emilia.gimenez@test.com', addressIdx: 13 },
    { name: 'Facundo', surname: 'Rivas', email: 'facundo.rivas@test.com', addressIdx: 14 },
    { name: 'Lucía', surname: 'Morales', email: 'lucia.morales@test.com', addressIdx: 15 },
    { name: 'Tomás', surname: 'Vega', email: 'tomas.vega@test.com', addressIdx: 16 },
    { name: 'Micaela', surname: 'Ortiz', email: 'micaela.ortiz@test.com', addressIdx: 17 },
  ]

  const createdClients = await Promise.all(
    clientData.map((c, idx) =>
      prisma.user.create({
        data: {
          name: c.name,
          surname: c.surname,
          email: c.email,
          password: passwordHash,
          nationalId: `${Math.floor(10000000 + Math.random() * 90000000)}`,
          nationalIdTypeId: dni.id,
          addressId: addresses[c.addressIdx].id,
          role: 'client',
          phone: '+5411' + Math.floor(1000000000 + Math.random() * 900000000),
          photo: AVATAR_PHOTOS[idx % AVATAR_PHOTOS.length],
        },
      }),
    ),
  )

  // Trabajadores
  const workerData = [
    { name: 'Carlos', surname: 'Méndez', email: 'carlos.mendez@trabajador.com', addressIdx: 4, photo: WORKER_PHOTOS[0], bio: 'Electricista matriculado con más de 15 años de experiencia. Instalaciones residenciales y comerciales.', categories: ['Electricidad'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes']), certificates: JSON.stringify([{ id: 'c1', title: 'Matriculado en Electricidad', issuer: 'CABA', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80' }]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80', caption: 'Tablero eléctrico' },{ id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', caption: 'Instalación LED' }]), kycStatus: 'APPROVED', emergenciesEnabled: true },
    { name: 'Roberto', surname: 'Sosa', email: 'roberto.sosa@trabajador.com', addressIdx: 7, photo: WORKER_PHOTOS[1], bio: 'Plomero gasista matriculado. Urgencias 24hs.', categories: ['Plomería'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábados']), certificates: JSON.stringify([{ id: 'c1', title: 'Gasista Matriculado', issuer: 'ENARGAS', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80' }]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80', caption: 'Reparación sanitaria' },{ id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d9e1a?w=600&q=80', caption: 'Instalación baño' }]), kycStatus: 'APPROVED', emergenciesEnabled: true },
    { name: 'Pablo', surname: 'Giménez', email: 'pablo.gimenez@trabajador.com', addressIdx: 3, photo: WORKER_PHOTOS[2], bio: 'Carpintero a medida. Muebles, puertas, pisos de madera.', categories: ['Carpintería'], availability: JSON.stringify(['Martes','Miércoles','Jueves','Viernes','Sábados']), certificates: JSON.stringify([]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1530125724549-b8ec6a5f3ab3?w=600&q=80', caption: 'Mueble a medida' },{ id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80', caption: 'Estantes flotantes' }]), kycStatus: 'APPROVED' },
    { name: 'Martín', surname: 'Luna', email: 'martin.luna@trabajador.com', addressIdx: 4, photo: WORKER_PHOTOS[3], bio: 'Pintor profesional. Interiores, exteriores, terminaciones finas.', categories: ['Pintura'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes']), certificates: JSON.stringify([]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80', caption: 'Pintura interior' },{ id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80', caption: 'Fachada' }]), kycStatus: 'APPROVED' },
    { name: 'Jorge', surname: 'Vega', email: 'jorge.vega@trabajador.com', addressIdx: 9, photo: WORKER_PHOTOS[4], bio: 'Albañil. Remodelaciones, revoques, pisos cerámicos.', categories: ['Albañilería'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábados']), certificates: JSON.stringify([{ id: 'c1', title: 'Maestro Mayor de Obra', issuer: 'CAPBA', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80' }]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', caption: 'Revoque' },{ id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=80', caption: 'Cerámicos' }]), kycStatus: 'APPROVED', emergenciesEnabled: true },
    { name: 'Federico', surname: 'Ortiz', email: 'federico.ortiz@trabajador.com', addressIdx: 10, photo: WORKER_PHOTOS[5], bio: 'Cerrajero 24hs. Apertura, cambio de cerraduras, seguridad.', categories: ['Cerrajería'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábados','Domingos']), certificates: JSON.stringify([]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=600&q=80', caption: 'Urgencias' }]), kycStatus: 'APPROVED', emergenciesEnabled: true },
    { name: 'Andrés', surname: 'Campos', email: 'andres.campos@trabajador.com', addressIdx: 16, photo: WORKER_PHOTOS[6], bio: 'Técnico en climatización. Instalación y mantenimiento de splits.', categories: ['Aire / HVAC'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes']), certificates: JSON.stringify([{ id: 'c1', title: 'Técnico en Refrigeración', issuer: 'INTI', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80' }]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80', caption: 'Split' }]), kycStatus: 'APPROVED' },
    { name: 'Diego', surname: 'Herrera', email: 'diego.herrera@trabajador.com', addressIdx: 2, photo: WORKER_PHOTOS[7], bio: 'Técnico en electrónica. PC, redes, electrodomésticos.', categories: ['Electrónica'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábados']), certificates: JSON.stringify([]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80', caption: 'Reparación' }]), kycStatus: 'PENDING' },
    { name: 'Gustavo', surname: 'Navarro', email: 'gustavo.navarro@trabajador.com', addressIdx: 5, photo: WORKER_PHOTOS[8], bio: 'Reformas integrales. Electricidad, plomería y albañilería.', categories: ['Electricidad','Plomería'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes']), certificates: JSON.stringify([{ id: 'c1', title: 'Electricista Matriculado', issuer: 'CABA', imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80' },{ id: 'c2', title: 'Gasista Matriculado', issuer: 'ENARGAS', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80' }]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', caption: 'Reforma integral' }]), kycStatus: 'APPROVED', emergenciesEnabled: true },
    { name: 'Alejandro', surname: 'Benítez', email: 'alejandro.benitez@trabajador.com', addressIdx: 6, photo: WORKER_PHOTOS[9], bio: 'Carpintería y pintura para terminaciones.', categories: ['Carpintería','Pintura'], availability: JSON.stringify(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábados']), certificates: JSON.stringify([]), gallery: JSON.stringify([{ id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=600&q=80', caption: 'Terminaciones' }]), kycStatus: 'APPROVED' },
  ]

  const createdWorkers = await Promise.all(
    workerData.map((w) =>
      prisma.user.create({
        data: {
          name: w.name, surname: w.surname, email: w.email, password: passwordHash,
          nationalId: `${Math.floor(10000000 + Math.random() * 90000000)}`,
          nationalIdTypeId: dni.id, addressId: addresses[w.addressIdx].id,
          role: UserRole.Worker, phone: '+5411' + Math.floor(1000000000 + Math.random() * 900000000),
          photo: w.photo, bio: w.bio, availability: w.availability, certificates: w.certificates,
          gallery: w.gallery, kycStatus: w.kycStatus, emergenciesEnabled: w.emergenciesEnabled || false,
        },
      }),
    ),
  )

  const categories = await Promise.all(CATEGORY_NAMES.map((name) => prisma.category.create({ data: { name } })))
  const categoryByName = new Map(categories.map((c) => [c.name, c]))

  for (let i = 0; i < workerData.length; i++) {
    for (const catName of workerData[i].categories) {
      const cat = categoryByName.get(catName)
      if (cat) await prisma.userCategory.create({ data: { userId: createdWorkers[i].id, categoryId: cat.id } })
    }
  }

  const jobDates = [
    { from: new Date('2026-05-10'), until: new Date('2026-05-12') },
    { from: new Date('2026-05-15'), until: new Date('2026-05-16') },
    { from: new Date('2026-05-18'), until: new Date('2026-05-20') },
    { from: new Date('2026-05-22'), until: new Date('2026-05-23') },
    { from: new Date('2026-05-25'), until: new Date('2026-05-27') },
    { from: new Date('2026-06-01'), until: new Date('2026-06-03') },
    { from: new Date('2026-06-05'), until: new Date('2026-06-07') },
    { from: new Date('2026-06-10'), until: new Date('2026-06-12') },
    { from: new Date('2026-06-15'), until: new Date('2026-06-17') },
    { from: new Date('2026-07-01'), until: new Date('2026-07-03') },
    { from: new Date('2026-07-08'), until: new Date('2026-07-10') },
    { from: new Date('2026-07-12'), until: new Date('2026-07-14') },
  ]

  // MUCHOS posts normales
  const postsData = [
    { title: 'Instalar spots LED empotrables en cocina', description: 'Instalar 8 spots LED empotrables en techo de durlock. Pasar cableado nuevo.', category: 'Electricidad', address: 'Recoleta, CABA', lat: -34.5889, lng: -58.3910, clientIdx: 0, status: 'Completed', dates: jobDates[0], images: 3 },
    { title: 'Revisar tablero eléctrico y cambiar térmicas', description: 'Tablero salta constantemente. Revisar conexiones y cambiar térmicas defectuosas.', category: 'Electricidad', address: 'Belgrano, CABA', lat: -34.5631, lng: -58.4556, clientIdx: 1, status: 'Completed', dates: jobDates[1], images: 2 },
    { title: 'Colocar tomas adicionales en dormitorio', description: 'Agregar 2 tomas de corriente. Cableado embutido.', category: 'Electricidad', address: 'Palermo, CABA', lat: -34.5889, lng: -58.4306, clientIdx: 4, status: 'Active', dates: jobDates[2], images: 2 },
    { title: 'Iluminación exterior para jardín', description: 'Instalar luces LED exteriores con sensor de movimiento.', category: 'Electricidad', address: 'San Isidro, Buenos Aires', lat: -34.4701, lng: -58.5189, clientIdx: 13, status: 'Active', dates: jobDates[3], images: 2 },
    { title: 'Reparar pérdida de agua en inodoro', description: 'Tanque pierde agua constantemente. Necesito reparación.', category: 'Plomería', address: 'Almagro, CABA', lat: -34.6045, lng: -58.4212, clientIdx: 2, status: 'Completed', dates: jobDates[4], images: 3 },
    { title: 'Cambiar canilla monocomando de cocina', description: 'Cambiar canilla monocomando por nueva. Sin pérdidas.', category: 'Plomería', address: 'Caballito, CABA', lat: -34.6196, lng: -58.4457, clientIdx: 3, status: 'Completed', dates: jobDates[5], images: 2 },
    { title: 'Destapar desagüe de cocina', description: 'Desagüe lento y mal olor. Destape profesional.', category: 'Plomería', address: 'Lanús, Buenos Aires', lat: -34.6939, lng: -58.3961, clientIdx: 11, status: 'Active', dates: jobDates[6], images: 2 },
    { title: 'Arreglar pérdida en cañería de baño', description: 'Pérdida debajo de lavatorio. Necesito localizar y reparar.', category: 'Plomería', address: 'Lomas de Zamora, Buenos Aires', lat: -34.7619, lng: -58.4056, clientIdx: 12, status: 'Active', dates: jobDates[7], images: 2 },
    { title: 'Fabricar e instalar estantes flotantes', description: '4 estantes flotantes de madera paraíso con mensulas ocultas.', category: 'Carpintería', address: 'Recoleta, CABA', lat: -34.5910, lng: -58.3930, clientIdx: 0, status: 'Completed', dates: jobDates[8], images: 3 },
    { title: 'Reparar puerta corrediza que descarrila', description: 'Puerta se sale de rieles. Ajustar o cambiar herrajes.', category: 'Carpintería', address: 'San Isidro, Buenos Aires', lat: -34.4701, lng: -58.5189, clientIdx: 13, status: 'Completed', dates: jobDates[9], images: 2 },
    { title: 'Hacer mueble bajo a medida', description: 'Mueble bajo de cocina 180cm con cajones push-pull.', category: 'Carpintería', address: 'Martínez, Buenos Aires', lat: -34.4947, lng: -58.5094, clientIdx: 12, status: 'Active', dates: jobDates[10], images: 3 },
    { title: 'Reparar puerta de madera', description: 'Puerta se traba, necesita ajuste de bisagras y cepillado.', category: 'Carpintería', address: 'Vicente López, Buenos Aires', lat: -34.5296, lng: -58.4750, clientIdx: 14, status: 'Active', dates: jobDates[11], images: 2 },
    { title: 'Pintar living comedor completo', description: 'Pintar living comedor 35m². Látex lavable, incluye masillado.', category: 'Pintura', address: 'San Justo, Buenos Aires', lat: -34.6703, lng: -58.5628, clientIdx: 7, status: 'Completed', dates: jobDates[0], images: 3 },
    { title: 'Pintar frente y rejas', description: 'Pintar frente, columnas, rejas y puerta. Pintura exterior.', category: 'Pintura', address: 'Vicente López, Buenos Aires', lat: -34.5296, lng: -58.4750, clientIdx: 14, status: 'Active', dates: { from: new Date('2026-07-05'), until: new Date('2026-07-08') }, images: 3 },
    { title: 'Pintar departamento 2 ambientes', description: 'Pintura integral: hall, living, cocina, dormitorios, baño. Techos incluidos.', category: 'Pintura', address: 'Ramos Mejía, Buenos Aires', lat: -34.6436, lng: -58.5639, clientIdx: 8, status: 'Active', dates: { from: new Date('2026-07-10'), until: new Date('2026-07-15') }, images: 2 },
    { title: 'Levantar tabique de durlock', description: 'Tabique divisor 4m x 2.60m con estructura metálica.', category: 'Albañilería', address: 'Morón, Buenos Aires', lat: -34.6514, lng: -58.6212, clientIdx: 9, status: 'Completed', dates: jobDates[1], images: 4 },
    { title: 'Reparar grietas y revocar pared', description: 'Abrir grietas en V, rellenar con epoxi, revocar.', category: 'Albañilería', address: 'Castelar, Buenos Aires', lat: -34.6482, lng: -58.6481, clientIdx: 10, status: 'Completed', dates: jobDates[2], images: 3 },
    { title: 'Colocar cerámicos en baño', description: 'Piso y pared. Nivelación, pastinas y sellado.', category: 'Albañilería', address: 'Lomas de Zamora, Buenos Aires', lat: -34.7619, lng: -58.4056, clientIdx: 12, status: 'Active', dates: { from: new Date('2026-07-08'), until: new Date('2026-07-12') }, images: 4 },
    { title: 'Construir contrapiso', description: 'Contrapiso para piso cerámico. Nivelado perfecto.', category: 'Albañilería', address: 'Avellaneda, Buenos Aires', lat: -34.6622, lng: -58.3653, clientIdx: 11, status: 'Active', dates: { from: new Date('2026-07-15'), until: new Date('2026-07-18') }, images: 3 },
    { title: 'Cambiar cilindro y revisar cerradura', description: 'Cilindro europeo anti-bumping. 3 llaves nuevas.', category: 'Cerrajería', address: 'Avellaneda, Buenos Aires', lat: -34.6622, lng: -58.3653, clientIdx: 11, status: 'Completed', dates: jobDates[3], images: 2 },
    { title: 'Apertura de urgencia + cambio de cerradura', description: 'Puerta trabada. Apertura sin daños.', category: 'Cerrajería', address: 'Tigre, Buenos Aires', lat: -34.4251, lng: -58.5796, clientIdx: 15, status: 'Completed', dates: jobDates[4], images: 2 },
    { title: 'Instalar cerradura multipunto', description: 'Cerradura de seguridad multipunto.', category: 'Cerrajería', address: 'Recoleta, CABA', lat: -34.5900, lng: -58.3920, clientIdx: 5, status: 'Active', dates: { from: new Date('2026-07-03'), until: new Date('2026-07-04') }, images: 2 },
    { title: 'Instalar aire acondicionado split 3000 fg', description: 'Instalación con vacío y puesta en marcha.', category: 'Aire / HVAC', address: 'Caballito, CABA', lat: -34.6186, lng: -58.4448, clientIdx: 3, status: 'Completed', dates: jobDates[5], images: 3 },
    { title: 'Mantenimiento integral de 2 splits', description: 'Limpieza, revisión de gas, desinfección.', category: 'Aire / HVAC', address: 'Palermo, CABA', lat: -34.5875, lng: -58.4290, clientIdx: 4, status: 'Completed', dates: jobDates[6], images: 2 },
    { title: 'Reparar aire que no enfría', description: 'Diagnóstico de falla, posible recarga de gas.', category: 'Aire / HVAC', address: 'Belgrano, CABA', lat: -34.5628, lng: -58.4560, clientIdx: 1, status: 'Active', dates: { from: new Date('2026-07-06'), until: new Date('2026-07-07') }, images: 2 },
    { title: 'Reparar PC que no enciende', description: 'Diagnóstico y reparación de fuente/motherboard.', category: 'Electrónica', address: 'Almagro, CABA', lat: -34.6035, lng: -58.4205, clientIdx: 2, status: 'Completed', dates: jobDates[7], images: 2 },
    { title: 'Instalar red WiFi mesh', description: 'Sistema mesh para casa de 2 plantas.', category: 'Electrónica', address: 'Martínez, Buenos Aires', lat: -34.4937, lng: -58.5105, clientIdx: 12, status: 'Completed', dates: jobDates[8], images: 2 },
    { title: 'Reparar notebook que no carga', description: 'Revisión de conector/batería/placa.', category: 'Electrónica', address: 'San Isidro, Buenos Aires', lat: -34.4695, lng: -58.5195, clientIdx: 13, status: 'Active', dates: { from: new Date('2026-07-09'), until: new Date('2026-07-10') }, images: 2 },
    // 10 posts adicionales
    { title: 'Instalar ventilador de techo', description: 'Instalación de ventilador de techo con soporte reforzado.', category: 'Electricidad', address: 'Villa Urquiza, CABA', lat: -34.5744, lng: -58.4855, clientIdx: 16, status: 'Active', dates: jobDates[9], images: 2 },
    { title: 'Cambiar juego de llaves de paso', description: 'Reemplazar llaves de paso antiguas por nuevas.', category: 'Plomería', address: 'Saavedra, CABA', lat: -34.5536, lng: -58.4930, clientIdx: 17, status: 'Active', dates: jobDates[10], images: 2 },
    { title: 'Armar placard empotrado', description: 'Fabricar e instalar placard empotrado a medida con interiores.', category: 'Carpintería', address: 'Núñez, CABA', lat: -34.5453, lng: -58.4626, clientIdx: 4, status: 'Active', dates: jobDates[11], images: 3 },
    { title: 'Pintar baño completo', description: 'Pintura antihumedad para baño. Incluye preparación.', category: 'Pintura', address: 'Villa Devoto, CABA', lat: -34.6009, lng: -58.5113, clientIdx: 6, status: 'Active', dates: { from: new Date('2026-07-16'), until: new Date('2026-07-18') }, images: 2 },
    { title: 'Nivelar piso y colocar porcelanato', description: 'Nivelación con autonivelante y colocación de porcelanato 60x60.', category: 'Albañilería', address: 'Floresta, CABA', lat: -34.6283, lng: -58.4826, clientIdx: 7, status: 'Active', dates: { from: new Date('2026-07-18'), until: new Date('2026-07-22') }, images: 3 },
    { title: 'Reparar sistema de alarma', description: 'Reparar central de alarma que no funciona correctamente.', category: 'Electricidad', address: 'Colegiales, CABA', lat: -34.5742, lng: -58.4527, clientIdx: 8, status: 'Active', dates: jobDates[8], images: 2 },
    { title: 'Desobstruir cloaca', description: 'Desobstrucción de cloaca con máquina rotativa.', category: 'Plomería', address: 'Parque Chacabuco, CABA', lat: -34.6361, lng: -58.4422, clientIdx: 9, status: 'Active', dates: jobDates[7], images: 2 },
    { title: 'Hacer estantería para biblioteca', description: 'Estantería modular a medida para biblioteca con lustrado.', category: 'Carpintería', address: 'Boedo, CABA', lat: -34.6260, lng: -58.4150, clientIdx: 10, status: 'Active', dates: jobDates[6], images: 3 },
    { title: 'Colocar vidrio templado en ducha', description: 'Instalación de mampara de vidrio templado para baño.', category: 'Albañilería', address: 'Barracas, CABA', lat: -34.6390, lng: -58.3820, clientIdx: 11, status: 'Active', dates: { from: new Date('2026-07-20'), until: new Date('2026-07-22') }, images: 2 },
    { title: 'Mantenimiento preventivo split', description: 'Limpieza completa, revisión y puesta a punto de split.', category: 'Aire / HVAC', address: 'Chacarita, CABA', lat: -34.5875, lng: -58.4558, clientIdx: 12, status: 'Active', dates: { from: new Date('2026-07-22'), until: new Date('2026-07-23') }, images: 2 },
  ]

  const createdPosts = []
  for (let i = 0; i < postsData.length; i++) {
    const item = postsData[i]
    const category = categoryByName.get(item.category)!
    const images = POST_IMAGES[item.category] || []
    const postImages = []
    for (let j = 0; j < item.images; j++) {
      if (images[j % images.length]) postImages.push({ url: images[j % images.length] })
    }
    const post = await prisma.post.create({
      data: {
        type: 'post',
        title: item.title,
        description: item.description,
        startDate: item.dates.from,
        endDate: item.dates.until,
        address: item.address,
        status: item.status,
        latitude: item.lat,
        longitude: item.lng,
        userId: createdClients[item.clientIdx].id,
        categories: { create: [{ categoryId: category.id }] },
        images: postImages.length > 0 ? { create: postImages } : undefined,
      },
    })
    createdPosts.push({ ...post, category: item.category, clientIdx: item.clientIdx })
  }

  // EMERGENCIAS - 24 horas de duración
  const emergencyPosts = []
  const emergencyData = [
    { title: 'Pérdida de agua urgente', description: 'Cañería rota, sale mucha agua. Necesito plomero YA.', category: 'Plomería', address: 'Flores, CABA', lat: -34.6280, lng: -58.4630, clientIdx: 16 },
    { title: 'Corte de luz parcial', description: 'Se fue la luz de mitad de casa. Posible corto.', category: 'Electricidad', address: 'Villa Crespo, CABA', lat: -34.5997, lng: -58.4436, clientIdx: 17 },
    { title: 'Puerta trabada urgente', description: 'Me quedé afuera, llave rota en cerradura.', category: 'Cerrajería', address: 'Caballito, CABA', lat: -34.6200, lng: -58.4450, clientIdx: 5 },
    { title: 'Aire acondicionado dejó de funcionar', description: 'Hace mucho calor, split no prende.', category: 'Aire / HVAC', address: 'Palermo, CABA', lat: -34.5860, lng: -58.4300, clientIdx: 6 },
    { title: 'Inodoro desbordándose', description: 'Inodoro tapado y desbordándose. Urgente.', category: 'Plomería', address: 'Almagro, CABA', lat: -34.6045, lng: -58.4215, clientIdx: 2 },
    { title: 'Tablero eléctrico chisporroteando', description: 'Tablero hace chispas al encender. Peligro eléctrico.', category: 'Electricidad', address: 'Belgrano, CABA', lat: -34.5635, lng: -58.4560, clientIdx: 1 },
    { title: 'Puerta de calle no cierra', description: 'Cerradura no traba, casa quedando sin seguridad.', category: 'Cerrajería', address: 'Recoleta, CABA', lat: -34.5895, lng: -58.3925, clientIdx: 0 },
    { title: 'Fuga de gas detectada', description: 'Olor a gas en cocina. Necesito gasista urgente.', category: 'Plomería', address: 'Caballito, CABA', lat: -34.6190, lng: -58.4460, clientIdx: 3 },
  ]
  for (let i = 0; i < emergencyData.length; i++) {
    const item = emergencyData[i]
    const category = categoryByName.get(item.category)!
    const images = POST_IMAGES[item.category] || []
    const now = new Date()
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const post = await prisma.post.create({
      data: {
        type: PostType.Emergency,
        userId: createdClients[item.clientIdx].id,
        title: item.title,
        description: item.description,
        startDate: now,
        endDate: expires,
        address: item.address,
        status: PostStatus.Active,
        latitude: item.lat,
        longitude: item.lng,
        isEmergency: true,
        emergencyExpiresAt: expires,
        allowsSubcontracting: false,
        categories: { create: [{ categoryId: category.id }] },
        images: images[0] ? { create: [{ url: images[0] }] } : undefined,
      },
    })
    emergencyPosts.push(post)
  }

  // SUBCONTRATACIONES - más subcontratos
  const parentPost = createdPosts[0] // electricidad completado
  const groupId1 = crypto.randomUUID()
  await prisma.post.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        type: PostType.SubContract,
        userId: createdWorkers[0].id,
        parentPostId: parentPost.id,
        subcontractGroupId: groupId1,
        title: 'Subcontratación: Instalar spots LED - Albañilería menor',
        description: 'Necesito ayuda para reparar rozas tras paso de cañería.',
        startDate: new Date('2026-05-11'),
        endDate: new Date('2026-05-12'),
        address: parentPost.address,
        status: PostStatus.Active,
        allowsSubcontracting: true,
      },
      {
        id: crypto.randomUUID(),
        type: PostType.SubContract,
        userId: createdWorkers[0].id,
        parentPostId: parentPost.id,
        subcontractGroupId: groupId1,
        title: 'Subcontratación: Instalar spots LED - Pintura de terminación',
        description: 'Pintura de pequeñísimo retoque tras instalación.',
        startDate: new Date('2026-05-11'),
        endDate: new Date('2026-05-12'),
        address: parentPost.address,
        status: PostStatus.Active,
        allowsSubcontracting: true,
      },
    ],
  })
  const subPosts1 = await prisma.post.findMany({ where: { subcontractGroupId: groupId1 } })
  await prisma.postCategory.createMany({
    data: [
      { id: crypto.randomUUID(), postId: subPosts1[0].id, categoryId: categoryByName.get('Albañilería')!.id, quantity: 1 },
      { id: crypto.randomUUID(), postId: subPosts1[1].id, categoryId: categoryByName.get('Pintura')!.id, quantity: 1 },
    ],
  })

  // Más subcontrataciones desde otros trabajos
  const parentPost2 = createdPosts[8] // carpintería
  const groupId2 = crypto.randomUUID()
  await prisma.post.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        type: PostType.SubContract,
        userId: createdWorkers[2].id,
        parentPostId: parentPost2.id,
        subcontractGroupId: groupId2,
        title: 'Subcontratación: Estantes flotantes - Pintura barnizado',
        description: 'Barnizado de estantes una vez instalados.',
        startDate: new Date('2026-06-09'),
        endDate: new Date('2026-06-10'),
        address: parentPost2.address,
        status: PostStatus.Active,
        allowsSubcontracting: true,
      },
    ],
  })
  const subPosts2 = await prisma.post.findMany({ where: { subcontractGroupId: groupId2 } })
  await prisma.postCategory.create({ data: { id: crypto.randomUUID(), postId: subPosts2[0].id, categoryId: categoryByName.get('Pintura')!.id, quantity: 1 } })

  const parentPost3 = createdPosts[15] // albañilería
  const groupId3 = crypto.randomUUID()
  await prisma.post.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        type: PostType.SubContract,
        userId: createdWorkers[4].id,
        parentPostId: parentPost3.id,
        subcontractGroupId: groupId3,
        title: 'Subcontratación: Tabique durlock - Electricidad para puntos',
        description: 'Pasar cableado para nuevos puntos tras levantar tabique.',
        startDate: new Date('2026-05-12'),
        endDate: new Date('2026-05-13'),
        address: parentPost3.address,
        status: PostStatus.Active,
        allowsSubcontracting: true,
      },
      {
        id: crypto.randomUUID(),
        type: PostType.SubContract,
        userId: createdWorkers[4].id,
        parentPostId: parentPost3.id,
        subcontractGroupId: groupId3,
        title: 'Subcontratación: Tabique durlock - Pintura de terminación',
        description: 'Masillado y pintura tras colocación de durlock.',
        startDate: new Date('2026-05-13'),
        endDate: new Date('2026-05-14'),
        address: parentPost3.address,
        status: PostStatus.Active,
        allowsSubcontracting: true,
      },
    ],
  })
  const subPosts3 = await prisma.post.findMany({ where: { subcontractGroupId: groupId3 } })
  await prisma.postCategory.createMany({
    data: [
      { id: crypto.randomUUID(), postId: subPosts3[0].id, categoryId: categoryByName.get('Electricidad')!.id, quantity: 1 },
      { id: crypto.randomUUID(), postId: subPosts3[1].id, categoryId: categoryByName.get('Pintura')!.id, quantity: 1 },
    ],
  })

  // APLICACIONES
  const apps = []
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[0].id, postId: createdPosts[0].id, status: ApplicationStatus.Completed, message: 'Instalo spots LED sin problemas.', createdAt: new Date('2026-05-05') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[0].id, postId: createdPosts[1].id, status: ApplicationStatus.Completed, message: 'Revisión completa con informe.', createdAt: new Date('2026-05-12') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[1].id, postId: createdPosts[4].id, status: ApplicationStatus.Completed, message: 'Arreglo sin líos.', createdAt: new Date('2026-05-16') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[1].id, postId: createdPosts[5].id, status: ApplicationStatus.Completed, message: 'Sin pérdidas garantizado.', createdAt: new Date('2026-05-20') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[2].id, postId: createdPosts[8].id, status: ApplicationStatus.Completed, message: 'Quedaron impecables.', createdAt: new Date('2026-05-28') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[2].id, postId: createdPosts[9].id, status: ApplicationStatus.Completed, message: 'Solucionado.', createdAt: new Date('2026-06-01') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[3].id, postId: createdPosts[12].id, status: ApplicationStatus.Completed, message: 'Terminación perfecta.', createdAt: new Date('2026-06-07') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[4].id, postId: createdPosts[15].id, status: ApplicationStatus.Completed, message: 'Muy prolijo.', createdAt: new Date('2026-05-03') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[4].id, postId: createdPosts[16].id, status: ApplicationStatus.Completed, message: 'Listo para pintar.', createdAt: new Date('2026-05-10') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[5].id, postId: createdPosts[19].id, status: ApplicationStatus.Completed, message: 'Sin dañar puerta.', createdAt: new Date('2026-05-16') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[5].id, postId: createdPosts[20].id, status: ApplicationStatus.Completed, message: 'Llegué rápido.', createdAt: new Date('2026-05-18') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[6].id, postId: createdPosts[22].id, status: ApplicationStatus.Completed, message: 'Instalación impecable.', createdAt: new Date('2026-05-20') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[6].id, postId: createdPosts[23].id, status: ApplicationStatus.Completed, message: 'Todo OK.', createdAt: new Date('2026-05-22') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[7].id, postId: createdPosts[25].id, status: ApplicationStatus.Completed, message: 'Fuente cambiada.', createdAt: new Date('2026-05-25') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[7].id, postId: createdPosts[26].id, status: ApplicationStatus.Completed, message: 'Cobertura perfecta.', createdAt: new Date('2026-05-28') } }))
  // Más aplicaciones activas
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[0].id, postId: createdPosts[2].id, status: ApplicationStatus.Pending, message: 'Puedo pasar a cotizar.', createdAt: new Date('2026-06-25') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[8].id, postId: createdPosts[6].id, status: ApplicationStatus.Accepted, message: 'Voy con máquina.', createdAt: new Date('2026-06-28') } }))
  apps.push(await prisma.application.create({ data: { workerId: createdWorkers[2].id, postId: createdPosts[10].id, status: ApplicationStatus.Pending, message: 'Muebles finos.', createdAt: new Date('2026-06-30') } }))

  // REVIEWS CON FOTOS
  const reviewEntries = [
    { appIdx: 0, rating: 5, desc: 'Excelente trabajo! Muy prolijo, puntual y dejó todo limpio. Recomendado al 100%.', photos: REVIEW_PHOTOS['Electricidad'] },
    { appIdx: 1, rating: 5, desc: 'Encontró el problema rápido y lo solucionó. Muy profesional.', photos: REVIEW_PHOTOS['Electricidad'] },
    { appIdx: 2, rating: 5, desc: 'Arregló la pérdida rápido. Muy amable y explicó todo.', photos: REVIEW_PHOTOS['Plomería'] },
    { appIdx: 3, rating: 4, desc: 'Buen trabajo, resultado perfecto.', photos: REVIEW_PHOTOS['Plomería'] },
    { appIdx: 4, rating: 5, desc: 'Los estantes quedaron hermosos! Justo lo que quería.', photos: REVIEW_PHOTOS['Carpintería'] },
    { appIdx: 5, rating: 5, desc: 'Ahora funciona perfecto. Muy hábil.', photos: REVIEW_PHOTOS['Carpintería'] },
    { appIdx: 6, rating: 5, desc: 'Pintura impecable. Muy limpio y prolijo.', photos: REVIEW_PHOTOS['Pintura'] },
    { appIdx: 7, rating: 5, desc: 'Tabique perfecto, bien nivelado.', photos: REVIEW_PHOTOS['Albañilería'] },
    { appIdx: 8, rating: 4, desc: 'Buen trabajo reparando grietas.', photos: REVIEW_PHOTOS['Albañilería'] },
    { appIdx: 9, rating: 5, desc: 'Muy rápido y profesional.', photos: REVIEW_PHOTOS['Cerrajería'] },
    { appIdx: 10, rating: 5, desc: 'Salvó el día! Llegó rapidísimo.', photos: REVIEW_PHOTOS['Cerrajería'] },
    { appIdx: 11, rating: 5, desc: 'Instalación impecable.', photos: REVIEW_PHOTOS['Aire / HVAC'] },
    { appIdx: 12, rating: 5, desc: 'Mantenimiento completo, muy profesional.', photos: REVIEW_PHOTOS['Aire / HVAC'] },
    { appIdx: 13, rating: 5, desc: 'PC funcionando como nuevo.', photos: REVIEW_PHOTOS['Electrónica'] },
    { appIdx: 14, rating: 5, desc: 'Cobertura perfecta en toda la casa.', photos: REVIEW_PHOTOS['Electrónica'] },
  ]
  for (let i = 0; i < reviewEntries.length; i++) {
    const r = reviewEntries[i]
    const app = apps[r.appIdx]
    const post = createdPosts.find(p => p.id === app.postId)!
    const photos = r.photos[0] ? [r.photos[i % r.photos.length]] : []
    await prisma.workerReview.create({
      data: {
        applicationId: app.id,
        reviewerId: createdClients[post.clientIdx].id,
        workerId: app.workerId,
        rating: r.rating,
        description: r.desc,
        mediaUrls: photos.length > 0 ? JSON.stringify(photos) : null,
      },
    })
    await prisma.clientReview.create({
      data: {
        applicationId: app.id,
        reviewerId: app.workerId,
        clientId: createdClients[post.clientIdx].id,
        rating: r.rating >= 4 ? 5 : r.rating,
        description: r.rating >= 4 ? 'Excelente cliente, pago puntual, comunicación fluida.' : 'Buen cliente.',
      },
    })
  }

  // LICITACIONES
  const biddingPost = await prisma.post.create({
    data: {
      type: PostType.Post,
      userId: createdClients[5].id,
      title: 'Renovación completa de baño',
      description: 'Renovar baño completo: demolición, plomería, electricidad, albañilería, cerámicos, grifería. Presupuesto máximo $450000.',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-25'),
      address: 'Av. Santa Fe 3200, CABA',
      status: PostStatus.Active,
      latitude: -34.5950,
      longitude: -58.4100,
      isBidding: true,
      bidWeights: JSON.stringify(['offeredCost', 'duration', 'startDate', 'minRating']),
      budgetMax: 450000,
      materialResponsibility: 'client',
      categories: {
        create: [
          { categoryId: categoryByName.get('Plomería')!.id },
          { categoryId: categoryByName.get('Electricidad')!.id },
          { categoryId: categoryByName.get('Albañilería')!.id },
        ],
      },
      images: { create: POST_IMAGES['Albañilería'].slice(0, 3).map(url => ({ url })) },
    },
  })
  await prisma.application.create({ data: { workerId: createdWorkers[8].id, postId: biddingPost.id, status: ApplicationStatus.Pending, message: 'Equipo completo para reforma integral. Presupuesto detallado.', visitCost: 380000, scheduledDate: new Date('2026-07-28'), createdAt: new Date('2026-07-20') } })
  await prisma.application.create({ data: { workerId: createdWorkers[4].id, postId: biddingPost.id, status: ApplicationStatus.Pending, message: 'Me encargo de albañilería y coordinación.', visitCost: 420000, scheduledDate: new Date('2026-07-29'), createdAt: new Date('2026-07-21') } })
  await prisma.application.create({ data: { workerId: createdWorkers[0].id, postId: biddingPost.id, status: ApplicationStatus.Pending, message: 'Parte eléctrica incluida.', visitCost: 450000, scheduledDate: new Date('2026-07-30'), createdAt: new Date('2026-07-22') } })

  const biddingPost2 = await prisma.post.create({
    data: {
      type: PostType.Post,
      userId: createdClients[7].id,
      title: 'Pintura completa de casa',
      description: 'Pintar interior y exterior de casa 150m². Paredes, techos, rejas. Colores a definir.',
      startDate: new Date('2026-08-05'),
      endDate: new Date('2026-08-15'),
      address: 'Av. de Mayo 800, San Justo',
      status: PostStatus.Active,
      latitude: -34.6705,
      longitude: -58.5630,
      isBidding: true,
      bidWeights: JSON.stringify(['offeredCost', 'duration', 'minRating']),
      budgetMax: 180000,
      materialResponsibility: 'to_agree',
      categories: { create: [{ categoryId: categoryByName.get('Pintura')!.id }] },
      images: { create: POST_IMAGES['Pintura'].slice(0, 2).map(url => ({ url })) },
    },
  })
  await prisma.application.create({ data: { workerId: createdWorkers[3].id, postId: biddingPost2.id, status: ApplicationStatus.Pending, message: 'Trabajo con pinturas premium.', visitCost: 150000, scheduledDate: new Date('2026-07-31'), createdAt: new Date('2026-07-25') } })
  await prisma.application.create({ data: { workerId: createdWorkers[9].id, postId: biddingPost2.id, status: ApplicationStatus.Pending, message: 'Terminaciones finas garantizadas.', visitCost: 165000, scheduledDate: new Date('2026-08-01'), createdAt: new Date('2026-07-26') } })

  console.log('✅ Seed RICH AMPLIADA creada!')
  console.log(`👥 Clientes: ${createdClients.length} | Trabajadores: ${createdWorkers.length}`)
  console.log(`📝 Posts normales: ${createdPosts.length} | Emergencias: ${emergencyPosts.length} | Subcontratos: ${(await prisma.post.count({ where: { type: PostType.SubContract } }))}`)
  console.log(`🏷️  Licitaciones: 2 | Aplicaciones: ${(await prisma.application.count())} | Reviews con fotos: ${reviewEntries.length}`)
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
