import { findByEmail } from '../../infrastructure/database/user.database.js'
import { createDiditSession } from '../../infrastructure/providers/didit.provider.js'

const createHttpError = (status: number, message: string): Error & { status?: number } => {
  const err = new Error(message) as Error & { status?: number }
  err.status = status
  return err
}

export const startKycVerification = async (
  email: string,
): Promise<{ sessionUrl: string; sessionId: string }> => {
  const user = await findByEmail(email)
  if (!user) {
    throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos')
  }
  return createDiditSession(user.id)
}
