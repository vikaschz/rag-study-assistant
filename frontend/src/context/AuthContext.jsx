import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { tokenStorage } from '../api/tokenStorage.js'
import { authService } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => tokenStorage.get())
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('studyspace:unauthorized', onUnauthorized)
    return () => window.removeEventListener('studyspace:unauthorized', onUnauthorized)
  }, [])

  useEffect(() => {
    let active = true
    if (!token) {
      setLoading(false)
      return () => { active = false }
    }
    authService.me()
      .then((currentUser) => { if (active) setUser(currentUser) })
      .catch(() => { if (active) logout() })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, logout])

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password)
    tokenStorage.set(result.access_token)
    setToken(result.access_token)
    try {
      const currentUser = await authService.me()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      logout()
      throw error
    }
  }, [logout])

  const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
