import { API_BASE_URL } from '../config/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Register new user
  async register(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Login user and store token
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem('authToken', this.token);
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Logout user and clear token
  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Get user info
  async getUserInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    // Handle JSON body serialization
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    // If token is expired or invalid, logout
    if (response.status === 401) {
      this.logout();
      window.location.reload(); // Refresh to show login screen
    }

    return response;
  }
}

const authService = new AuthService();

export default authService;

// Named exports for convenience
export const login = (username, password) => authService.login(username, password);
export const register = (username, password) => authService.register(username, password);
export const logout = () => authService.logout();
export const isAuthenticated = () => authService.isAuthenticated();
export const getUserInfo = () => authService.getUserInfo(); 