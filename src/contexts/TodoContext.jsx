import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'
import apiClient from '../services/api'

const TodoContext = createContext()

const initialState = {
  todos: [],
  calendars: [],
  templates: [],
  loading: false,
  error: null
}

const todoReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    case 'LOAD_ALL_DATA':
      return {
        ...state,
        todos: action.payload.todos || [],
        calendars: action.payload.calendars || [],
        templates: action.payload.templates || [],
        loading: false,
        error: null
      }
    
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload]
      }
    
    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo => 
          todo.id === action.payload.id ? action.payload : todo
        )
      }
    
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      }
    
    case 'ADD_CALENDAR':
      return {
        ...state,
        calendars: [...state.calendars, action.payload]
      }
    
    case 'UPDATE_CALENDAR':
      return {
        ...state,
        calendars: state.calendars.map(calendar => 
          calendar.id === action.payload.id ? action.payload : calendar
        )
      }
    
    case 'DELETE_CALENDAR':
      return {
        ...state,
        calendars: state.calendars.filter(calendar => calendar.id !== action.payload),
        todos: state.todos.filter(todo => todo.calendarId !== action.payload)
      }
    
    case 'ADD_TEMPLATE':
      return {
        ...state,
        templates: [...state.templates, action.payload]
      }
    
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(template => template.id !== action.payload)
      }
    
    default:
      return state
  }
}

export function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(todoReducer, initialState)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Helper function to convert API response fields to frontend format
  const transformApiTodo = (apiTodo) => ({
    ...apiTodo,
    startDate: apiTodo.start_date,
    endDate: apiTodo.end_date,
    createdAt: apiTodo.created_at,
    calendarId: apiTodo.calendar_id
  })

  // Helper function to convert frontend fields to API format
  const transformToApiTodo = (frontendTodo) => ({
    ...frontendTodo,
    start_date: frontendTodo.startDate,
    end_date: frontendTodo.endDate,
    calendar_id: frontendTodo.calendarId
  })

  const loadAllData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const [todosResponse, calendarsResponse, templatesResponse] = await Promise.all([
        apiClient.getTodos(),
        apiClient.getCalendars(),
        apiClient.getTemplates()
      ])
      
      const transformedTodos = todosResponse.map(transformApiTodo)
      
      dispatch({ 
        type: 'LOAD_ALL_DATA', 
        payload: { 
          todos: transformedTodos, 
          calendars: calendarsResponse, 
          templates: templatesResponse 
        } 
      })
    } catch (error) {
      console.error('Failed to load data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' })
    }
  }

  // Function to reset context state (called when user logs out)
  const resetData = useCallback(() => {
    dispatch({ type: 'LOAD_ALL_DATA', payload: { todos: [], calendars: [], templates: [] } })
    setDataInitialized(false)
    setCurrentUser(null)
  }, [])

  // Function to initialize data (called externally when authenticated)
  const initializeData = useCallback(async (username = null, forceReload = false) => {
    // If different user, always reload
    if (username && currentUser && username !== currentUser) {
      forceReload = true
    }
    
    if (dataInitialized && !forceReload) return
    
    try {
      await loadAllData()
      setDataInitialized(true)
      setCurrentUser(username)
    } catch (error) {
      console.log('Data initialization failed - likely not authenticated')
      dispatch({ type: 'SET_ERROR', payload: 'Authentication required' })
    }
  }, [currentUser, dataInitialized])

  // Todo operations
  const addTodo = async (todo) => {
    try {
      // Use the first available calendar if no calendarId is specified
      const defaultCalendarId = todo.calendarId || (state.calendars.length > 0 ? state.calendars[0].id : null)
      
      const todoData = {
        ...todo,
        calendarId: defaultCalendarId
      }
      
      const apiTodo = transformToApiTodo(todoData)
      const createdTodo = await apiClient.createTodo(apiTodo)
      const transformedTodo = transformApiTodo(createdTodo)
      
      dispatch({ type: 'ADD_TODO', payload: transformedTodo })
      return transformedTodo
    } catch (error) {
      console.error('Failed to create todo:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create todo' })
      throw error
    }
  }

  const updateTodo = async (id, updates) => {
    try {
      const apiUpdates = transformToApiTodo(updates)
      const updatedTodo = await apiClient.updateTodo(id, apiUpdates)
      const transformedTodo = transformApiTodo(updatedTodo)
      
      dispatch({ type: 'UPDATE_TODO', payload: transformedTodo })
      return transformedTodo
    } catch (error) {
      console.error('Failed to update todo:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update todo' })
      throw error
    }
  }

  const deleteTodo = async (id) => {
    try {
      await apiClient.deleteTodo(id)
      dispatch({ type: 'DELETE_TODO', payload: id })
    } catch (error) {
      console.error('Failed to delete todo:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete todo' })
      throw error
    }
  }

  const addCalendar = async (calendar) => {
    try {
      const createdCalendar = await apiClient.createCalendar(calendar)
      dispatch({ type: 'ADD_CALENDAR', payload: createdCalendar })
      return createdCalendar
    } catch (error) {
      console.error('Failed to create calendar:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create calendar' })
      throw error
    }
  }

  const updateCalendar = async (id, updates) => {
    try {
      const updatedCalendar = await apiClient.updateCalendar(id, updates)
      dispatch({ type: 'UPDATE_CALENDAR', payload: updatedCalendar })
      return updatedCalendar
    } catch (error) {
      console.error('Failed to update calendar:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update calendar' })
      throw error
    }
  }

  const deleteCalendar = async (id) => {
    try {
      await apiClient.deleteCalendar(id)
      dispatch({ type: 'DELETE_CALENDAR', payload: id })
    } catch (error) {
      console.error('Failed to delete calendar:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete calendar' })
      throw error
    }
  }

  const addTemplate = async (template) => {
    try {
      const createdTemplate = await apiClient.createTemplate(template)
      dispatch({ type: 'ADD_TEMPLATE', payload: createdTemplate })
      return createdTemplate
    } catch (error) {
      console.error('Failed to create template:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create template' })
      throw error
    }
  }

  const deleteTemplate = async (id) => {
    try {
      await apiClient.deleteTemplate(id)
      dispatch({ type: 'DELETE_TEMPLATE', payload: id })
    } catch (error) {
      console.error('Failed to delete template:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete template' })
      throw error
    }
  }

  const createTodoFromTemplate = async (templateId, customizations = {}) => {
    try {
      const template = state.templates.find(t => t.id === templateId)
      if (!template) {
        throw new Error('Template not found')
      }

      const todo = {
        title: template.title,
        description: template.description,
        calendarId: template.calendarId,
        estimatedTime: template.estimatedTime,
        priority: template.priority,
        ...customizations
      }

      return await addTodo(todo)
    } catch (error) {
      console.error('Failed to create todo from template:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create todo from template' })
      throw error
    }
  }

  // Manual migration function for users who have localStorage data
  const migrateFromLocalStorage = async (localStorageData) => {
    try {
      const result = await apiClient.migrateData(localStorageData)
      await loadAllData() // Reload data after migration
      return result
    } catch (error) {
      console.error('Failed to migrate data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to migrate data' })
      throw error
    }
  }

  const value = {
    todos: state.todos,
    calendars: state.calendars,
    templates: state.templates,
    loading: state.loading,
    error: state.error,
    addTodo,
    updateTodo,
    deleteTodo,
    addCalendar,
    updateCalendar,
    deleteCalendar,
    addTemplate,
    deleteTemplate,
    createTodoFromTemplate,
    loadAllData,
    initializeData,
    resetData,
    migrateFromLocalStorage
  }

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  )
}

export function useTodos() {
  const context = useContext(TodoContext)
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider')
  }
  return context
} 