import { createHttpError } from '../../lib/errors.js';
import { env } from '../../lib/envConfig.js';
import { findByEmail, createUser, addUserCategories, updateUserByEmail } from '../../infrastructure/database/user.database.js';
import { upsertCategoryByName } from '../../infrastructure/database/category.database.js';
import { createAuth0User, loginWithAuth0, getAuth0UserInfo, assignAuth0Role, sendAuth0PasswordReset, getAuth0UserByEmail, sendAuth0VerificationEmail } from '../../infrastructure/providers/auth0.provider.js';
import { UserRole } from '../types/userRole.js';
const managedPassword = 'AUTH0_MANAGED_ACCOUNT';
export const registerUser = async (input) => {
    const name = input.name?.trim();
    const lastName = input.lastName?.trim();
    const email = input.email?.trim()?.toLowerCase();
    const password = input.password;
    const phone = input.phone?.trim() || undefined;
    if (!name)
        throw createHttpError(400, 'El nombre es obligatorio');
    if (!email)
        throw createHttpError(400, 'El correo electrónico es obligatorio');
    if (!password)
        throw createHttpError(400, 'La contraseña es obligatoria');
    const existing = await findByEmail(email);
    if (existing)
        throw createHttpError(409, 'El correo electrónico ya está registrado');
    const auth0User = await createAuth0User({ email, password, name, lastName });
    const clientRoleId = env.AUTH0_CLIENT_ROLE_ID;
    if (clientRoleId) {
        try {
            await assignAuth0Role(auth0User.auth0Id, clientRoleId);
        }
        catch {
            console.error('Failed to assign client role in Auth0');
        }
    }
    const userData = {
        name,
        email,
        password: managedPassword,
        phone,
        surname: lastName ?? '',
        role: UserRole.Client,
    };
    const user = await createUser(userData);
    return {
        userId: user.id,
        email: auth0User?.email ?? email,
        emailVerified: auth0User?.emailVerified ?? false,
        message: 'Usuario registrado exitosamente',
    };
};
export const registerWorker = async (input) => {
    const name = input.name.trim();
    const lastName = input.lastName?.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    const phone = input.phone?.trim() || undefined;
    if (!input.categories || input.categories.length === 0) {
        throw createHttpError(400, 'Debes seleccionar al menos una especialidad');
    }
    const existing = await findByEmail(email);
    if (existing)
        throw createHttpError(409, 'El correo electrónico ya está registrado');
    const auth0User = await createAuth0User({ email, password, name, lastName });
    const workerRoleId = env.AUTH0_WORKER_ROLE_ID;
    if (workerRoleId) {
        try {
            await assignAuth0Role(auth0User.auth0Id, workerRoleId);
        }
        catch {
            console.error('Failed to assign worker role in Auth0');
        }
    }
    const user = await createUser({
        name: lastName ? `${name} ${lastName}` : name,
        email,
        password: managedPassword,
        phone,
        role: UserRole.Worker,
    });
    const categoryIds = await Promise.all(input.categories.map(async (catName) => {
        const cat = await upsertCategoryByName(catName);
        return cat.id;
    }));
    await addUserCategories(user.id, categoryIds);
    return {
        userId: user.id,
        email: auth0User?.email ?? email,
        emailVerified: auth0User?.emailVerified ?? false,
        message: 'Trabajador registrado exitosamente',
    };
};
export const loginUser = async (input) => {
    const email = input.email?.trim().toLowerCase();
    const password = input.password;
    if (!email)
        throw createHttpError(400, 'Email is required');
    if (!password)
        throw createHttpError(400, 'Password is required');
    const tokenData = await loginWithAuth0(email, password);
    const profile = await getAuth0UserInfo(tokenData.access_token);
    if (profile.email_verified !== true) {
        throw createHttpError(403, 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisá tu bandeja de entrada.');
    }
    const profileEmail = profile.email?.toLowerCase() ?? email;
    const existing = await findByEmail(profileEmail);
    const user = existing
        ? {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            phone: existing.phone,
            photo: existing.photo,
            role: existing.role,
            createdAt: existing.createdAt,
        }
        : await createUser({
            email: profileEmail,
            name: profile.name ?? profile.nickname ?? profile.sub ?? profileEmail,
            password: managedPassword,
            phone: profile.phone_number,
        });
    if (!user)
        throw createHttpError(500, 'Could not resolve user');
    return {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, photo: user.photo, role: user.role, createdAt: user.createdAt },
    };
};
export const resendVerificationEmail = async (email) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail)
        throw createHttpError(400, 'El correo electrónico es obligatorio');
    const auth0User = await getAuth0UserByEmail(normalizedEmail);
    if (!auth0User)
        throw createHttpError(404, 'No encontramos una cuenta con ese correo');
    if (auth0User.email_verified)
        throw createHttpError(400, 'El correo ya fue verificado');
    await sendAuth0VerificationEmail(auth0User.user_id);
    return { message: 'Email de verificación reenviado. Revisá tu bandeja de entrada.' };
};
export const forgotPassword = async (email) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail)
        throw createHttpError(400, 'El correo electrónico es obligatorio');
    await sendAuth0PasswordReset(normalizedEmail);
    return { message: 'Si el correo está registrado, recibirás un email para restablecer tu contraseña' };
};
export const syncAuth0User = async (claims, isRegistration = false) => {
    if (!claims?.sub)
        throw Object.assign(new Error('Invalid Auth0 token: missing sub claim'), { status: 401 });
    const fallbackEmail = `${claims.sub}@auth0.local`;
    const email = claims.email ?? fallbackEmail;
    if (claims.email) {
        const realUserExists = await findByEmail(claims.email);
        if (!realUserExists) {
            const ghost = await findByEmail(fallbackEmail);
            if (ghost) {
                const goodName = claims.name ?? claims.nickname;
                await updateUserByEmail(fallbackEmail, {
                    email: claims.email,
                    ...(goodName && ghost.name === claims.sub ? { name: goodName } : {}),
                });
            }
        }
    }
    const existing = await findByEmail(email);
    if (existing) {
        const { password: _, ...safeUser } = existing;
        const updates = {};
        if (claims.role && safeUser.role === 'user')
            updates.role = claims.role;
        const goodName = claims.name ?? claims.nickname;
        if (goodName && safeUser.name === claims.sub)
            updates.name = goodName;
        if (Object.keys(updates).length > 0) {
            return updateUserByEmail(email, updates);
        }
        return safeUser;
    }
    if (!isRegistration) {
        throw createHttpError(404, 'No encontramos una cuenta con este correo. Por favor registrate primero.');
    }
    const user = await createUser({
        email,
        name: claims.name ?? claims.nickname ?? claims.sub,
        password: managedPassword,
        phone: claims.phone_number,
        role: UserRole.Client,
    });
    return user;
};
