import { useState, useEffect, useContext, createContext, useMemo } from 'react'
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
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const register = async (name, email, password, age, gender) => {
    const res = await authApi.register(name, email, password, age, gender)
    localStorage.setItem('access_token', res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('access_token', res.data.access_token)
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const updateProfile = async (data) => {
    console.log('updateProfile not yet implemented', data)
  }

  // Admin check: dev mode or admin email domain
  const isAdmin = useMemo(() => {
    if (import.meta.env.DEV) return true
    return user?.email?.endsWith('@admin.docai.com') || false
  }, [user])

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
  }), [user, loading, isAdmin])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
