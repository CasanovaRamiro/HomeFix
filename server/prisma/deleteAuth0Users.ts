import 'dotenv/config'
import prisma from '../src/lib/prisma.js'

const ISSUER = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, '')
const CLIENT_ID = process.env.AUTH0_M2M_CLIENT_ID
const CLIENT_SECRET = process.env.AUTH0_M2M_CLIENT_SECRET

if (!ISSUER || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing AUTH0_ISSUER_BASE_URL, AUTH0_M2M_CLIENT_ID, or AUTH0_M2M_CLIENT_SECRET in .env')
  process.exit(1)
}

async function getManagementToken(): Promise<string> {
  const resp = await fetch(`${ISSUER}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      audience: `${ISSUER}/api/v2/`,
    }),
  })
  if (!resp.ok) throw new Error(`Failed to get management token: ${await resp.text()}`)
  const data = (await resp.json()) as { access_token: string }
  return data.access_token
}

async function getAllAuth0Users(token: string): Promise<{ user_id: string; email: string }[]> {
  const users: { user_id: string; email: string }[] = []
  let page = 0
  const perPage = 100

  while (true) {
    const resp = await fetch(`${ISSUER}/api/v2/users?per_page=${perPage}&page=${page}&include_totals=false`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error(`Failed to fetch users: ${await resp.text()}`)
    const batch = (await resp.json()) as { user_id: string; email: string }[]
    if (batch.length === 0) break
    users.push(...batch)
    if (batch.length < perPage) break
    page++
  }

  return users
}

async function deleteAuth0User(token: string, userId: string): Promise<void> {
  const resp = await fetch(`${ISSUER}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`Failed to delete ${userId}: ${await resp.text()}`)
  }
}

async function clearPrismaDB() {
  console.log('\nClearing Prisma DB...')
  await prisma.workerReview.deleteMany()
  await prisma.clientReview.deleteMany()
  await prisma.telegramLinkCode.deleteMany()
  await prisma.jobApplication.deleteMany()
  await prisma.application.deleteMany()
  await prisma.postImage.deleteMany()
  await prisma.postCategory.deleteMany()
  await prisma.userCategory.deleteMany()
  await prisma.post.deleteMany({ where: { parentPostId: { not: null } } })
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
  await prisma.address.deleteMany()
  await prisma.nationalIdType.deleteMany()
  await prisma.category.deleteMany()
  console.log('Prisma DB cleared.')
}

async function main() {
  const token = await getManagementToken()

  const users = await getAllAuth0Users(token)
  console.log(`Found ${users.length} users in Auth0.`)

  if (users.length > 0) {
    for (const user of users) {
      await deleteAuth0User(token, user.user_id)
      console.log(`Deleted from Auth0: ${user.email} (${user.user_id})`)
    }
    console.log(`\n${users.length} users deleted from Auth0.`)
  } else {
    console.log('No Auth0 users to delete.')
  }

  await clearPrismaDB()
  console.log('\nAll done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
