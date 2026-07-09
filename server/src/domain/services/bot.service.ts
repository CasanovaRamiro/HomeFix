import { UserRole } from '../types/userRole.js'
import type {
  DomainBotStatus,
  EmergencyToggleResult,
  LinkResult,
  BotGreeting,
  BotLinkInfo,
} from '../types/bot.types.js'
import * as botDb from '../../infrastructure/database/bot.database.js'
import { buildStartLink } from '../../infrastructure/providers/telegram.provider.js'

const LINK_CODE_TTL_MS = 5 * 60 * 1000

const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const createLink = async (userId: string): Promise<BotLinkInfo> => {
  const code = generateCode()
  await botDb.createLinkCode(userId, code, new Date(Date.now() + LINK_CODE_TTL_MS))
  const deepLink = await buildStartLink(code)
  return { code, deepLink }
}

export const linkAccount = async (chatId: string, rawCode: string): Promise<LinkResult> => {
  const code = rawCode.trim().toUpperCase()
  const linkCode = await botDb.findLinkCode(code)
  if (!linkCode || linkCode.used || linkCode.expiresAt < new Date()) {
    return { status: 'invalid' }
  }
  await botDb.markLinkCodeUsed(linkCode.id)
  await botDb.linkChatToUser(linkCode.userId, chatId)
  return { status: 'linked' }
}

export const toggleEmergencies = async (chatId: string): Promise<EmergencyToggleResult> => {
  const user = await botDb.findUserByChatId(chatId)
  if (!user) return { status: 'not_linked' }
  if (user.role !== UserRole.Worker) return { status: 'not_worker' }
  const enabled = !user.emergenciesEnabled
  await botDb.setEmergenciesEnabled(user.id, enabled)
  return { status: 'toggled', enabled }
}

export const resolveGreeting = async (chatId: string): Promise<BotGreeting> => {
  const user = await botDb.findUserByChatId(chatId)
  return user ? { linked: true, name: user.name } : { linked: false, name: null }
}

export const getStatus = (userId: string): Promise<DomainBotStatus | null> =>
  botDb.findBotStatus(userId)

export const unlink = (userId: string): Promise<void> =>
  botDb.clearBotLink(userId)
