export const toClientProfileDTO = (profile, options) => {
    const dto = {
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
        bio: profile.bio,
        role: profile.role,
        photo: profile.photo,
        createdAt: profile.createdAt.toISOString(),
        averageRating: profile.averageRating,
        reviewCount: profile.reviewCount,
        completedJobs: profile.completedJobs,
    };
    if (options.includeContact) {
        dto.email = profile.email;
        dto.phone = profile.phone;
    }
    dto.address = profile.address;
    return dto;
};
