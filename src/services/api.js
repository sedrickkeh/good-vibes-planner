const API_BASE_URL = 'http://10.242.11.210:8000/api'

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Handle empty responses
      const text = await response.text()
      return text ? JSON.parse(text) : {}
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Todo endpoints
  async getTodos() {
    return this.request('/todos')
  }

  async createTodo(todo) {
    return this.request('/todos', {
      method: 'POST',
      body: todo,
    })
  }

  async updateTodo(id, updates) {
    return this.request(`/todos/${id}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteTodo(id) {
    return this.request(`/todos/${id}`, {
      method: 'DELETE',
    })
  }

  // Calendar endpoints
  async getCalendars() {
    return this.request('/calendars')
  }

  async createCalendar(calendar) {
    return this.request('/calendars', {
      method: 'POST',
      body: calendar,
    })
  }

  async updateCalendar(id, updates) {
    return this.request(`/calendars/${id}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteCalendar(id) {
    return this.request(`/calendars/${id}`, {
      method: 'DELETE',
    })
  }

  // Project endpoints
  async getProjects() {
    return this.request('/projects')
  }

  async createProject(project) {
    return this.request('/projects', {
      method: 'POST',
      body: project,
    })
  }

  async updateProject(id, updates) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // Template endpoints
  async getTemplates() {
    return this.request('/templates')
  }

  async createTemplate(template) {
    return this.request('/templates', {
      method: 'POST',
      body: template,
    })
  }

  async deleteTemplate(id) {
    return this.request(`/templates/${id}`, {
      method: 'DELETE',
    })
  }

  // Data migration
  async migrateData(data) {
    return this.request('/migrate', {
      method: 'POST',
      body: data,
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient 