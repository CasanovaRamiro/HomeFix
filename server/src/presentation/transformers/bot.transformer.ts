import type { DomainBotStatus, BotLinkInfo } from '../../domain/types/bot.types.js'
import type { BotLinkDTO, BotStatusDTO } from '../types/bot.types.js'

export const toBotLinkDTO = (info: BotLinkInfo): BotLinkDTO => ({
  code: info.code,
  deepLink: info.deepLink,
  message: `Enviá /link ${info.code} al bot de HomeFix`,
})

export const toBotStatusDTO = (status: DomainBotStatus): BotStatusDTO => ({
  linked: status.linked,
  linkedAt: status.linkedAt ? status.linkedAt.toISOString() : null,
})
