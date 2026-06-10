export interface NotificationMessage {
  text: string
  parseMode?: 'HTML' | 'Markdown'
}

export interface NotificationProvider {
  readonly name: string
  send(recipient: string, message: NotificationMessage): Promise<boolean>
}
