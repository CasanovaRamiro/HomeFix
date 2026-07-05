export interface DomainLinkCode {
  id: string
  userId: string
  used: boolean
  expiresAt: Date
}

export interface DomainBotStatus {
  linked: boolean
  linkedAt: Date | null
}

export interface BotUser {
  id: string
  name: string
  role: string
  emergenciesEnabled: boolean
}

export interface EmergencyWorker {
  id: string
  chatId: string
}

export interface BotLinkInfo {
  code: string
  deepLink: string
}

export type LinkResult =
  | { status: 'linked' }
  | { status: 'invalid' }

export type EmergencyToggleResult =
  | { status: 'toggled'; enabled: boolean }
  | { status: 'not_linked' }
  | { status: 'not_worker' }

export interface BotGreeting {
  linked: boolean
  name: string | null
}
