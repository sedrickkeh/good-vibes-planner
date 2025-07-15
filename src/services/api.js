import authService from './auth'

import { API_BASE_URL } from '../config/api'

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    // Use the auth service for authenticated requests
    try {
      const response = await authService.makeAuthenticatedRequest(url, options)
      
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