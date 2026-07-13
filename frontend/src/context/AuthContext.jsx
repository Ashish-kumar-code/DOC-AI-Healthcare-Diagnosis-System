import { useState, useEffect, useContext, createContext, useMemo, useCallback } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.profile()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (name, email, password, age, gender) => {
    const res = await authApi.register(name, email, password, age, gender)
    localStorage.setItem('access_token', res.data.access_token)
    if (res.data.refresh_token) {
      localStorage.setItem('refresh_token', res.data.refresh_token)
    }
    setUser(res.data.user)
    return res.data
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('access_token', res.data.access_token)
    if (res.data.refresh_token) {
      localStorage.setItem('refresh_token', res.data.refresh_token)
    }
    setUser(res.data.user)
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data) => {
    console.log('updateProfile not yet implemented', data)
  }, [])

  // Admin check: use is_admin flag from server
  const isAdmin = useMemo(() => {
    return user?.is_admin === true
  }, [user])

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
  }), [user, loading, isAdmin, register, login, logout, updateProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
