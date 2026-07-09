import api from './api'

export const telegramLink = (): Promise<{ code: string; deepLink: string; message: string }> =>
  api.post('/telegram/link').then((r) => r.data)

export const telegramStatus = (): Promise<{ linked: boolean; linkedAt: string | null }> =>
  api.get('/telegram/status').then((r) => r.data)

export const telegramUnlink = () =>
  api.delete('/telegram/unlink')
