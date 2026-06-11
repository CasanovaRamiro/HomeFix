export interface NotificationMessage {
  text: string
  parseMode?: 'HTML' | 'Markdown'
  buttons?: Array<{ text: string; url: string }>
}

export interface NotificationProvider {
  readonly name: string
  send(recipient: string, message: NotificationMessage): Promise<boolean>
}
