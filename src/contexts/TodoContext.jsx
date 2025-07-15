import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import apiClient from '../services/api'

const TodoContext = createContext()

const initialState = {
  todos: [],
  calendars: [],
  templates: [],
  loading: false,
  error: null
}

function todoReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    
    case 'LOAD_ALL_DATA':
      return { 
        ...state, 
        todos: action.payload.todos || [],
        calendars: action.payload.calendars || [],
        templates: action.payload.templates || [],
        loading: false,
        error: null
      }
    
    case 'SET_TODOS':
      return { ...state, todos: action.payload }
    
    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] }
    
    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id ? { ...todo, ...action.payload } : todo
        )
      }
    
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      }
    
    case 'SET_CALENDARS':
      return { ...state, calendars: action.payload }
    
    case 'ADD_CALENDAR':
      return { ...state, calendars: [...state.calendars, action.payload] }
    
    case 'UPDATE_CALENDAR':
      return {
        ...state,
        calendars: state.calendars.map(calendar =>
          calendar.id === action.payload.id ? { ...calendar, ...action.payload } : calendar
        )
      }
    
    case 'DELETE_CALENDAR':
      return {
        ...state,
        calendars: state.calendars.filter(calendar => calendar.id !== action.payload.id),
        todos: state.todos.filter(todo => todo.calendarId !== action.payload.id)
      }
    
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload }
    
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] }
    
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
  const [migrationAttempted, setMigrationAttempted] = useState(false)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Helper function to convert API response fields to frontend format
  const transformApiTodo = (apiTodo) => ({
    ...apiTodo,
    startDate: apiTodo.start_date,
    endDate: apiTodo.end_date,
    estimatedTime: apiTodo.estimated_time,
    calendarId: apiTodo.calendar_id,
    isCompleted: apiTodo.is_completed,
    createdAt: apiTodo.created_at,
    completedAt: apiTodo.completed_at,
    isRecurring: apiTodo.is_recurring,
    recurringPattern: apiTodo.recurring_pattern,
    recurringCount: apiTodo.recurring_count
  })

  // Helper function to convert frontend format to API format
  const transformToApiTodo = (todo) => ({
    title: todo.title,
    description: todo.description || null,
    start_date: todo.startDate || null,
    end_date: todo.endDate || null,
    estimated_time: todo.estimatedTime || null,
    priority: todo.priority || 'medium',
    calendar_id: todo.calendarId || null,
    is_recurring: todo.isRecurring || false,
    recurring_pattern: todo.recurringPattern || null,
    recurring_count: todo.recurringCount || null
  })

  // Helper function to convert API response fields for calendars
  const transformApiCalendar = (apiCalendar) => ({
    ...apiCalendar,
    isDefault: apiCalendar.is_default
  })

  // Helper function to convert frontend calendar to API format
  const transformToApiCalendar = (calendar) => ({
    name: calendar.name,
    color: calendar.color,
    is_default: calendar.isDefault || false
  })

  // Load all data from API
  const loadAllData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const [todos, calendars, templates] = await Promise.all([
        apiClient.getTodos(),
        apiClient.getCalendars(),
        apiClient.getTemplates()
      ])

      dispatch({
        type: 'LOAD_ALL_DATA',
        payload: {
          todos: todos.map(transformApiTodo),
          calendars: calendars.map(transformApiCalendar),
          templates
        }
      })
    } catch (error) {
      console.error('Failed to load data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' })
    }
  }

  // Attempt data migration from localStorage
  const attemptMigration = async () => {
    if (migrationAttempted) return
    
    try {
      const savedData = localStorage.getItem('good-vibes-data')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        
        // Check if there's meaningful data to migrate
        const hasData = (parsedData.todos && parsedData.todos.length > 0) ||
                       (parsedData.calendars && parsedData.calendars.length > 0) ||
                       (parsedData.templates && parsedData.templates.length > 0)
        
        if (hasData) {
          console.log('Migrating localStorage data to database...')
          await apiClient.migrateData(parsedData)
          console.log('Data migration completed successfully')
          
          // Clear localStorage after successful migration
          localStorage.removeItem('good-vibes-data')
        }
      }
    } catch (error) {
      console.error('Data migration failed:', error)
      // Don't show error to user, just log it and continue
    } finally {
      setMigrationAttempted(true)
    }
  }

  // Function to reset context state (called when user logs out)
  const resetData = () => {
    dispatch({ type: 'LOAD_ALL_DATA', payload: { todos: [], calendars: [], templates: [] } })
    setDataInitialized(false)
    setMigrationAttempted(false)
    setCurrentUser(null)
  }

  // Function to initialize data (called externally when authenticated)
  const initializeData = async (username = null, forceReload = false) => {
    // If different user, always reload
    if (username && currentUser && username !== currentUser) {
      forceReload = true
    }
    
    if (dataInitialized && !forceReload) return
    
    try {
      await attemptMigration()
      await loadAllData()
      setDataInitialized(true)
      setCurrentUser(username)
    } catch (error) {
      console.log('Data initialization failed - likely not authenticated')
      dispatch({ type: 'SET_ERROR', payload: 'Authentication required' })
    }
  }

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
      // Transform field names for API
      const apiUpdates = {}
      if (updates.title !== undefined) apiUpdates.title = updates.title
      if (updates.description !== undefined) apiUpdates.description = updates.description
      if (updates.startDate !== undefined) apiUpdates.start_date = updates.startDate
      if (updates.endDate !== undefined) apiUpdates.end_date = updates.endDate
      if (updates.estimatedTime !== undefined) apiUpdates.estimated_time = updates.estimatedTime
      if (updates.priority !== undefined) apiUpdates.priority = updates.priority
      if (updates.calendarId !== undefined) apiUpdates.calendar_id = updates.calendarId
      if (updates.isCompleted !== undefined) apiUpdates.is_completed = updates.isCompleted

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

  // Calendar operations
  const addCalendar = async (calendar) => {
    try {
      const apiCalendar = transformToApiCalendar(calendar)
      const createdCalendar = await apiClient.createCalendar(apiCalendar)
      const transformedCalendar = transformApiCalendar(createdCalendar)
      
      dispatch({ type: 'ADD_CALENDAR', payload: transformedCalendar })
      return transformedCalendar
    } catch (error) {
      console.error('Failed to create calendar:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create calendar' })
      throw error
    }
  }

  const updateCalendar = async (id, updates) => {
    try {
      const apiUpdates = {}
      if (updates.name !== undefined) apiUpdates.name = updates.name
      if (updates.color !== undefined) apiUpdates.color = updates.color
      if (updates.isDefault !== undefined) apiUpdates.is_default = updates.isDefault

      const updatedCalendar = await apiClient.updateCalendar(id, apiUpdates)
      const transformedCalendar = transformApiCalendar(updatedCalendar)
      
      dispatch({ type: 'UPDATE_CALENDAR', payload: transformedCalendar })
      return transformedCalendar
    } catch (error) {
      console.error('Failed to update calendar:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update calendar' })
      throw error
    }
  }

  const deleteCalendar = async (id) => {
    try {
      await apiClient.deleteCalendar(id)
      dispatch({ type: 'DELETE_CALENDAR', payload: { id } })
    } catch (error) {
      console.error('Failed to delete calendar:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete calendar' })
      throw error
    }
  }

  // Template operations
  const addTemplate = async (template) => {
    try {
      const apiTemplate = {
        name: template.name,
        title: template.title,
        description: template.description || null,
        start_date: template.startDate || null,
        end_date: template.endDate || null,
        estimated_time: template.estimatedTime || null,
        priority: template.priority || 'medium',
        calendar_id: template.calendarId || null
      }
      
      const createdTemplate = await apiClient.createTemplate(apiTemplate)
      // Transform back to frontend format
      const transformedTemplate = {
        ...createdTemplate,
        startDate: createdTemplate.start_date,
        endDate: createdTemplate.end_date,
        estimatedTime: createdTemplate.estimated_time,
        calendarId: createdTemplate.calendar_id
      }
      
      dispatch({ type: 'ADD_TEMPLATE', payload: transformedTemplate })
      return transformedTemplate
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

  const createTodoFromTemplate = async (templateId, overrides = {}) => {
    const template = state.templates.find(t => t.id === templateId)
    if (!template) return

    // Use the first available calendar if no calendarId is specified
    const defaultCalendarId = overrides.calendarId || (state.calendars.length > 0 ? state.calendars[0].id : null)

    const todo = {
      title: template.title,
      description: template.description,
      startDate: template.startDate,
      endDate: template.endDate,
      estimatedTime: template.estimatedTime,
      priority: template.priority,
      calendarId: defaultCalendarId,
      ...overrides
    }
    
    return await addTodo(todo)
  }

  const value = {
    ...state,
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
    resetData
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