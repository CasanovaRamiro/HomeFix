export const toDomainClientReview = (r) => ({
    id: r.id,
    rating: r.rating,
    description: r.description,
    createdAt: r.createdAt,
    reviewer: r.reviewer,
    client: r.client,
});
