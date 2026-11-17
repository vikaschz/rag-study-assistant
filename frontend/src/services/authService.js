import api from '../api/axios.js'

export const authService = {
  async login(email, password) {
    const body = new URLSearchParams({ username: email, password })
    const { data } = await api.post('/api/auth/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },
  async register(payload) {
    const { data } = await api.post('/api/auth/register', payload)
    return data
  },
  async me() {
    const { data } = await api.get('/api/auth/me')
    return data
  },
}
