export interface NotificationMessage {
  text: string
  parseMode?: 'HTML' | 'Markdown'
  buttons?: Array<{ text: string; url: string }>
}

export type NotificationSendResult =
  | { ok: true }
  | { ok: false; reason: 'transient' | 'permanent_block' }

export interface NotificationProvider {
  readonly name: string
  send(recipient: string, message: NotificationMessage): Promise<NotificationSendResult>
}
