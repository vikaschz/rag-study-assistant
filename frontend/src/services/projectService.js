import api from '../api/axios.js'

export const projectService = {
  async list() {
    const { data } = await api.get('/api/projects/')
    return data
  },
  async get(projectId) {
    const { data } = await api.get(`/api/projects/${encodeURIComponent(projectId)}`)
    return data
  },
  async create(payload) {
    const { data } = await api.post('/api/projects/', payload)
    return data
  },
  async remove(projectId) {
    await api.delete(`/api/projects/${encodeURIComponent(projectId)}`)
  },
}
