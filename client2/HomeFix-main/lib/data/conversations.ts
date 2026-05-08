export interface ConversationMessage {
  id: string
  sender: 'user' | 'worker'
  text: string
  timestamp: string
}

export interface Conversation {
  id: string
  workerId: string
  workerName: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  messages: ConversationMessage[]
}

export const conversations: Conversation[] = [
  {
    id: 'c1',
    workerId: '1',
    workerName: 'Carlos Mejía',
    lastMessage: 'Perfecto, nos vemos el sábado a las 10 AM',
    lastMessageTime: '2024-04-17T15:30:00',
    unread: 0,
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hola Carlos, necesito revisar mis tomas eléctricas',
        timestamp: '2024-04-16T10:00:00'
      },
      {
        id: 'm2',
        sender: 'worker',
        text: 'Hola! Con gusto puedo ayudarte. ¿Cuándo te vendría bien?',
        timestamp: '2024-04-16T10:15:00'
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'El próximo sábado en la mañana',
        timestamp: '2024-04-16T10:30:00'
      },
      {
        id: 'm4',
        sender: 'worker',
        text: 'Perfecto, nos vemos el sábado a las 10 AM',
        timestamp: '2024-04-17T15:30:00'
      }
    ]
  },
  {
    id: 'c2',
    workerId: '2',
    workerName: 'María González',
    lastMessage: 'Consultaré precios y te aviso',
    lastMessageTime: '2024-04-15T12:00:00',
    unread: 1,
    messages: [
      {
        id: 'm5',
        sender: 'user',
        text: 'Hola María, tengo una fuga en el baño',
        timestamp: '2024-04-15T11:00:00'
      },
      {
        id: 'm6',
        sender: 'worker',
        text: 'Entiendo, puedo visitarte pronto. ¿Es urgente?',
        timestamp: '2024-04-15T11:20:00'
      },
      {
        id: 'm7',
        sender: 'user',
        text: 'No es urgente, pero necesito que sea pronto',
        timestamp: '2024-04-15T11:40:00'
      },
      {
        id: 'm8',
        sender: 'worker',
        text: 'Consultaré precios y te aviso',
        timestamp: '2024-04-15T12:00:00'
      }
    ]
  }
]
