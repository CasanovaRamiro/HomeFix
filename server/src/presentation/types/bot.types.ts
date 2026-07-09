export interface BotLinkDTO {
  code: string
  deepLink: string
  message: string
}

export interface BotStatusDTO {
  linked: boolean
  linkedAt: string | null
}
