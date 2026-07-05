import type { NotificationMessage } from '../../domain/types/notification.types.js'
import type { BotGreeting, EmergencyToggleResult, LinkResult } from '../../domain/types/bot.types.js'

// The bot's "view": maps domain results/data to the user-facing message the adapter sends.
// Pure functions — no transport, no service calls. This is where all inbound-bot copy lives.

export const renderLinkResult = (result: LinkResult): NotificationMessage => ({
  text: result.status === 'linked'
    ? '✅ ¡Cuenta vinculada con éxito! A partir de ahora vas a recibir notificaciones de HomeFix acá.'
    : 'Código inválido o expirado. Generá uno nuevo en tu perfil.',
})

export const renderLinkUsage = (): NotificationMessage => ({
  text: 'Usá: /link CÓDIGO (ej: /link ABC12345)',
})

export const renderWelcome = (): NotificationMessage => ({
  text:
    '¡Bienvenido a HomeFix! 🛠️\n\n'
    + 'Para vincular tu cuenta de Telegram con HomeFix:\n'
    + '1. Iniciá sesión en homefix.vercel.app\n'
    + '2. Andá a tu perfil → "Vincular Telegram"\n'
    + '3. Copiá el código que aparece\n'
    + '4. Enviá /link <código>\n\n'
    + 'Ejemplo: /link ABC12345',
})

export const renderEmergencyToggle = (result: EmergencyToggleResult): NotificationMessage => {
  if (result.status === 'not_linked') {
    return { text: '❌ No tenés tu cuenta vinculada. Usá /link para vincular.' }
  }
  if (result.status === 'not_worker') {
    return { text: '❌ Solo los trabajadores pueden activar notificaciones de emergencia.' }
  }
  return {
    text: result.enabled
      ? '✅ Notificaciones de emergencia ACTIVADAS. Vas a recibir alertas de publicaciones urgentes en tu zona.'
      : '🔕 Notificaciones de emergencia DESACTIVADAS. No vas a recibir alertas de publicaciones urgentes.',
  }
}

export const renderHelp = (): NotificationMessage => ({
  text:
    '📋 <b>Comandos disponibles</b>\n\n'
    + '/link &lt;código&gt; — Vincular tu cuenta de HomeFix\n'
    + '/emergencias — Activar/desactivar notificaciones de emergencia\n'
    + '/help — Mostrar esta ayuda',
  parseMode: 'HTML',
})

export const renderGreeting = (greeting: BotGreeting, corsOrigin: string): NotificationMessage => {
  if (greeting.linked) {
    return {
      text: `¡Hola ${greeting.name}, recordá que con HomeFix podés solucionar cualquier inconveniente que tengas en tu casa!`,
    }
  }
  return {
    text:
      '👋 ¡Hola! No tengo tu cuenta vinculada todavía.\n\n'
      + 'Para recibir notificaciones de HomeFix:\n'
      + `1. Iniciá sesión en ${corsOrigin}\n`
      + '2. Andá a tu perfil → "Vincular Telegram"\n'
      + '3. Generá un código y enviá /link <código>',
  }
}
