import prisma from '../src/lib/prisma.js';
import { UserRole } from '../src/domain/types/userRole.js';
import { PostStatus } from '../src/domain/types/postStatus.js';
const PASSWORD = 'AUTH0_MANAGED_ACCOUNT';
async function main() {
    // Ensure categories exist
    const CATEGORIES = ['Electricidad', 'Plomería', 'Carpintería', 'Pintura', 'Albañilería', 'Cerrajería', 'Aire / HVAC', 'Electrónica'];
    for (const name of CATEGORIES) {
        await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    }
    const categoryByName = new Map((await prisma.category.findMany()).map((c) => [c.name, c]));
    // Ensure national ID type exists
    const dniType = await prisma.nationalIdType.findFirst() ?? await prisma.nationalIdType.create({ data: { description: 'DNI' } });
    // Ensure addresses exist
    const addr1 = await prisma.address.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: { id: '00000000-0000-0000-0000-000000000001', street: 'Av. Corrientes', number: '2500', city: 'CABA', state: 'Buenos Aires' },
    });
    const addr2 = await prisma.address.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: { id: '00000000-0000-0000-0000-000000000002', street: 'Av. Santa Fe', number: '1500', city: 'CABA', state: 'Buenos Aires' },
    });
    const addr3 = await prisma.address.upsert({
        where: { id: '00000000-0000-0000-0000-000000000003' },
        update: {},
        create: { id: '00000000-0000-0000-0000-000000000003', street: 'Av. Cabildo', number: '800', city: 'CABA', state: 'Buenos Aires' },
    });
    const addr4 = await prisma.address.upsert({
        where: { id: '00000000-0000-0000-0000-000000000004' },
        update: {},
        create: { id: '00000000-0000-0000-0000-000000000004', street: 'Av. Rivadavia', number: '5000', city: 'CABA', state: 'Buenos Aires' },
    });
    // Ensure a client exists
    const client = await prisma.user.upsert({
        where: { email: 'cliente-licitacion@test.com' },
        update: {},
        create: {
            name: 'Martina', surname: 'Gutierrez', email: 'cliente-licitacion@test.com',
            password: PASSWORD, role: 'user', phone: '+541123456789',
            nationalId: '12345678', addressId: addr1.id,
            nationalIdTypeId: dniType.id,
        },
    });
    // Create 3 workers
    const workerData = [
        { name: 'Pablo', surname: 'Giménez', email: 'pablo@test.com', phone: '+5491122221111' },
        { name: 'Lucía', surname: 'Méndez', email: 'lucia@test.com', phone: '+5491133332222' },
        { name: 'Roberto', surname: 'Sosa', email: 'roberto@test.com', phone: '+5491144443333' },
    ];
    const workers = await Promise.all(workerData.map((w, i) => prisma.user.upsert({
        where: { email: w.email },
        update: { name: w.name, surname: w.surname, phone: w.phone },
        create: {
            name: w.name, surname: w.surname, email: w.email, password: PASSWORD,
            role: UserRole.Worker, phone: w.phone, nationalId: String(Math.floor(10000000 + Math.random() * 90000000)),
            addressId: [addr2, addr3, addr4][i].id, nationalIdTypeId: dniType.id,
        },
    })));
    // Purge previous test applications for clean state
    const biddingPost = await prisma.post.findFirst({
        where: { userId: client.id, isBidding: true },
        orderBy: { createdAt: 'desc' },
    });
    if (biddingPost) {
        await prisma.application.deleteMany({ where: { postId: biddingPost.id } });
        await prisma.postCategory.deleteMany({ where: { postId: biddingPost.id } });
        await prisma.postImage.deleteMany({ where: { postId: biddingPost.id } });
        await prisma.post.delete({ where: { id: biddingPost.id } });
    }
    // Create bidding post
    const post = await prisma.post.create({
        data: {
            title: 'Renovación completa de baño',
            description: 'Necesito renovar el baño principal: cambiar revestimientos, sanitarios, grifería y colocar mampara. Presupuesto estimado $350.000 - $500.000.',
            address: 'Av. Corrientes 2500, CABA',
            latitude: -34.6037, longitude: -58.4087,
            startDate: new Date('2026-07-05'),
            endDate: new Date('2026-07-25'),
            status: PostStatus.Active,
            userId: client.id,
            isBidding: true,
            bidWeights: JSON.stringify(['offeredCost', 'duration', 'startDate', 'minRating']),
            materialResponsibility: 'client',
            budgetMax: 500000,
            images: {
                create: { url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80' },
            },
            categories: {
                create: [
                    { categoryId: categoryByName.get('Electricidad').id },
                    { categoryId: categoryByName.get('Plomería').id },
                    { categoryId: categoryByName.get('Albañilería').id },
                ],
            },
        },
    });
    // Create applications from each worker with varying offers
    await prisma.application.create({
        data: {
            workerId: workers[0].id, postId: post.id,
            status: 'Pending', message: 'Puedo empezar la semana que viene. Tengo experiencia en reformas integrales.',
            visitCost: 420000, scheduledDate: new Date('2026-07-10'),
            createdAt: new Date('2026-07-06'),
        },
    });
    await prisma.application.create({
        data: {
            workerId: workers[1].id, postId: post.id,
            status: 'Pending', message: 'Hola! Trabajo con un equipo de 3 personas, podemos terminar en una semana.',
            visitCost: 380000, scheduledDate: new Date('2026-07-12'),
            createdAt: new Date('2026-07-07'),
        },
    });
    await prisma.application.create({
        data: {
            workerId: workers[2].id, postId: post.id,
            status: 'Pending', message: 'Soy arquitecto y tengo mi propio equipo. Presupuesto detallado sin sorpresas.',
            visitCost: 480000, scheduledDate: new Date('2026-07-08'),
            createdAt: new Date('2026-07-05'),
        },
    });
    console.log('Seed OK — licitación de prueba creada con 3 ofertas.');
    console.log(` Cliente: ${client.email} | Post: ${post.id}`);
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
