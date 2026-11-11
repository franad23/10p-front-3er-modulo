const KEY = 'access_token'

export const getToken = () => localStorage.getItem(KEY)
export const setToken = (token: string) => localStorage.setItem(KEY, token)
export const clearToken = () => localStorage.removeItem(KEY)

type TokenPayload = {
  id: string
  name: string
  lastname: string
  email: string
  role: 'ADMIN' | 'CLIENT'
}

export const getTokenPayload = (): TokenPayload | null => {
  const token = getToken()
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}
