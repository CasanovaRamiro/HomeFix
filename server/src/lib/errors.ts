export interface HttpError extends Error {
  status?: number
}

export const createHttpError = (status: number, message: string): HttpError => {
  const error = new Error(message) as HttpError
  error.status = status
  return error
}
