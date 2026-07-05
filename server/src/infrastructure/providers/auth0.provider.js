import { createHttpError } from '../../lib/errors.js';
import { env } from '../../lib/envConfig.js';
const getIssuerBaseUrl = () => {
    const issuer = env.AUTH0_ISSUER_BASE_URL;
    if (!issuer)
        throw createHttpError(500, 'AUTH0_ISSUER_BASE_URL is not configured');
    return issuer.replace(/\/$/, '');
};
const getRequiredEnv = (key) => {
    const value = env[key];
    if (!value) {
        throw createHttpError(500, `${key} is not configured`);
    }
    return value;
};
let _mgmtToken = null;
export const getManagementToken = async () => {
    if (_mgmtToken && Date.now() < _mgmtToken.expiresAt)
        return _mgmtToken.token;
    const issuer = getIssuerBaseUrl();
    const clientId = env.AUTH0_M2M_CLIENT_ID;
    const clientSecret = env.AUTH0_M2M_CLIENT_SECRET;
    if (!clientId)
        throw createHttpError(500, 'AUTH0_M2M_CLIENT_ID is not configured');
    if (!clientSecret)
        throw createHttpError(500, 'AUTH0_M2M_CLIENT_SECRET is not configured');
    const resp = await fetch(`${issuer}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: `${issuer}/api/v2/`,
        }),
    });
    if (!resp.ok)
        throw createHttpError(502, 'Failed to get Auth0 Management API token');
    const data = (await resp.json());
    _mgmtToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return _mgmtToken.token;
};
export const assignAuth0Role = async (auth0UserId, roleId) => {
    const issuer = getIssuerBaseUrl();
    const token = await getManagementToken();
    const resp = await fetch(`${issuer}/api/v2/users/${encodeURIComponent(auth0UserId)}/roles`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: [roleId] }),
    });
    if (!resp.ok) {
        const text = await resp.text();
        console.error('Failed to assign Auth0 role:', text);
    }
};
export const createAuth0User = async (payload) => {
    const response = await fetch(`${getIssuerBaseUrl()}/dbconnections/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: getRequiredEnv('AUTH0_CLIENT_ID'),
            connection: getRequiredEnv('AUTH0_DB_CONNECTION'),
            email: payload.email,
            password: payload.password,
            given_name: payload.name,
            family_name: payload.lastName,
            name: payload.lastName ? `${payload.name} ${payload.lastName}` : payload.name,
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        console.error('Auth0 signup error', response.status, text);
        if (response.status === 400 && (/already exists|user already exists|exists/i.test(text) || /"code":"invalid_signup"/.test(text))) {
            throw createHttpError(409, 'Email already registered');
        }
        if (response.status === 400 && /password|weak/i.test(text)) {
            throw createHttpError(400, 'Password does not meet Auth0 policy');
        }
        console.error('Auth0 signup error:', response.status, text);
        throw createHttpError(502, 'Failed to create user in Auth0');
    }
    const data = (await response.json());
    return {
        auth0Id: `auth0|${data._id}`,
        email: data.email,
        emailVerified: data.email_verified,
    };
};
export const loginWithAuth0 = async (email, password) => {
    const audience = env.AUTH0_AUDIENCE;
    if (!audience)
        throw createHttpError(500, 'AUTH0_AUDIENCE is not configured');
    const response = await fetch(`${getIssuerBaseUrl()}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
            client_id: getRequiredEnv('AUTH0_CLIENT_ID'),
            username: email,
            password,
            audience,
            realm: getRequiredEnv('AUTH0_DB_CONNECTION'),
            scope: 'openid profile email',
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        console.error('Error de Auth0:', text);
        if (response.status === 400 && /invalid_grant|wrong email|wrong password|invalid/i.test(text)) {
            throw createHttpError(401, 'Correo electrónico o contraseña incorrectos');
        }
        throw createHttpError(502, 'Error al autenticar con Auth0');
    }
    return (await response.json());
};
export const getAuth0UserInfo = async (accessToken) => {
    const response = await fetch(`${getIssuerBaseUrl()}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        throw createHttpError(502, 'Failed to fetch user profile from Auth0');
    }
    return (await response.json());
};
export const getAuth0UserByEmail = async (email) => {
    const issuer = getIssuerBaseUrl();
    const token = await getManagementToken();
    const resp = await fetch(`${issuer}/api/v2/users-by-email?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok)
        return null;
    const users = (await resp.json());
    return users[0] ?? null;
};
export const sendAuth0VerificationEmail = async (auth0UserId) => {
    const issuer = getIssuerBaseUrl();
    const token = await getManagementToken();
    const resp = await fetch(`${issuer}/api/v2/jobs/verification-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: auth0UserId }),
    });
    if (!resp.ok) {
        throw createHttpError(502, 'Error al enviar el email de verificación');
    }
};
export const sendAuth0PasswordReset = async (email) => {
    const response = await fetch(`${getIssuerBaseUrl()}/dbconnections/change_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: getRequiredEnv('AUTH0_CLIENT_ID'),
            connection: getRequiredEnv('AUTH0_DB_CONNECTION'),
            email,
        }),
    });
    if (!response.ok) {
        throw createHttpError(502, 'Error al contactar el servicio de autenticación');
    }
};
