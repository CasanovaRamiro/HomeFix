import api from './api'

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const { data } = await api.post('/upload', form)
  return data.urls as string[]
}

export const downloadMatricula = (url: string): Promise<Blob> =>
  api.get('/upload/download', { params: { url }, responseType: 'blob' }).then((r) => r.data)
