import api from './api'
import type { ClientReviewInput } from '../types/clientReview'

export const createClientReview = (data: ClientReviewInput) =>
  api.post('/reviews/client', data)
