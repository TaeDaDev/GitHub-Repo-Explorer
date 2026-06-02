const TOKEN_KEY = 'gh_explorer_token'
const USER_KEY = 'gh_explorer_user'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => { localStorage.setItem(TOKEN_KEY, token) }
export const getUser = (): { id: string; email: string } | null => {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as { id: string; email: string }) : null
}
export const setUser = (user: { id: string; email: string }): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
