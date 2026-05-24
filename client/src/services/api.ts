import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3000' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getWorkers = (): Promise<Worker[]> =>
  api.get<Worker[]>('/workers').then((r) => r.data)

export const getWorker = (id: number): Promise<Worker> =>
  api.get<Worker>(`/workers/${id}`).then((r) => r.data)

export interface Worker {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
}

export default api
