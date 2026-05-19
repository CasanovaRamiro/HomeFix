import { PostInput } from "../types/postInput.js"

export const postServiceValidator = (input: PostInput): void => {
  if (!input.categoryIds || input.categoryIds.length === 0) {
    throw new Error('At least one category must be selected')
  }

  if (!input.startDate) {
    throw new Error('startDate is required')
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
}

