import { PostInput } from "../types/postInput.js"

export const postServiceValidator = (input: PostInput): void => {
  if (!input.categoryId) {
    throw new Error('At least one category must be selected')
  }

  if (!input.title || input.title.trim() === '') {
    throw new Error('title is required')
  }

  if (!input.description || input.description.trim() === '') {
    throw new Error('description is required')
  }

  if (!input.address || input.address.trim() === '') {
    throw new Error('address is required')
  }

  if (input.endDate <= input.startDate) {
    throw new Error('endDate must be after startDate')
  }
}

