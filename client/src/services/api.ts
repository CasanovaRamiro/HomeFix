import { env } from '../lib/envConfig'
import axios from 'axios'

const api = axios.create({ baseURL: env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
