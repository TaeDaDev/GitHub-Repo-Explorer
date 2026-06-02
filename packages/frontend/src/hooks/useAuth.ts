import { useState, useCallback } from 'react'
import axios from 'axios'
import { getToken, setToken, getUser, setUser, clearAuth } from '../lib/auth'
import type { LoginRequest, RegisterRequest, AuthResponse } from '@github-explorer/shared'

export const useAuth = () => {
  const [token, setTokenState] = useState<string | null>(getToken)
  const [user, setUserState] = useState(getUser)

  const login = useCallback(async (data: LoginRequest) => {
    const res = await axios.post<AuthResponse>('/auth/login', data)
    setToken(res.data.token); setUser(res.data.user)
    setTokenState(res.data.token); setUserState(res.data.user)
    return res.data
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await axios.post<AuthResponse>('/auth/register', data)
    setToken(res.data.token); setUser(res.data.user)
    setTokenState(res.data.token); setUserState(res.data.user)
    return res.data
  }, [])

  const logout = useCallback(() => {
    clearAuth(); setTokenState(null); setUserState(null)
  }, [])

  return { token, user, login, register, logout, isAuthenticated: !!token }
}
