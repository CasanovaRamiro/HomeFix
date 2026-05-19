export interface MappedPostData {
  categories: {
    create: Array<{ category: { connect: { id: number } } }>
  }
  [key: string]: unknown
}