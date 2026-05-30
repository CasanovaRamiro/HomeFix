export interface PostInput {
  startDate: string | Date
  endDate: string | Date
  categoryId: string
  title: string
  description: string
  address: string
}

export const postServiceValidator = (input: PostInput): void => {

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

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

  if (end <= start) {
    throw new Error('endDate must be after startDate')
  }
}