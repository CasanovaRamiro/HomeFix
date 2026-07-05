export const toDomainClientProfileBase = (c) => ({
    id: c.id,
    name: c.name,
    surname: c.surname,
    email: c.email,
    phone: c.phone,
    bio: c.bio,
    role: c.role,
    photo: c.photo,
    createdAt: c.createdAt,
    address: c.address ?? null,
});
