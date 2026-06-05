import { env } from './envConfig'

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function loginWithGoogle() {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)

  sessionStorage.setItem('pkce_verifier', verifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.VITE_AUTH0_CLIENT_ID,
    redirect_uri: env.VITE_AUTH0_CALLBACK_URL,
    scope: 'openid profile email',
    audience: env.VITE_AUTH0_AUDIENCE,
    connection: 'google-oauth2',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${env.VITE_AUTH0_DOMAIN}/authorize?${params}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  id_token: string
  token_type: string
  expires_in: number
}> {
  const verifier = sessionStorage.getItem('pkce_verifier')
  if (!verifier) throw new Error('Missing PKCE verifier — inicia el flujo desde /login o /register')

  sessionStorage.removeItem('pkce_verifier')

  const resp = await fetch(`${env.VITE_AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: env.VITE_AUTH0_CLIENT_ID,
      code_verifier: verifier,
      code,
      redirect_uri: env.VITE_AUTH0_CALLBACK_URL,
    }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Error al obtener tokens: ${text}`)
  }

  return resp.json() as Promise<{ access_token: string; id_token: string; token_type: string; expires_in: number }>
}
