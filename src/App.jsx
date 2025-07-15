import React, { useState, useEffect } from 'react'
import { Calendar, CheckSquare, Plus, CalendarDays, AlertCircle, Loader2, LogOut, User } from 'lucide-react'
import TodayView from './components/TodayView'
import MultiCalendarView from './components/MultiCalendarView'
import TodoCreator from './components/TodoCreator'
import Login from './components/Login'
import Register from './components/Register'
import { TodoProvider, useTodos } from './contexts/TodoContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const { loading, error, initializeData, resetData } = useTodos()
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('calendars')
  const [showTodoCreator, setShowTodoCreator] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  // Initialize data when authenticated, reset when not authenticated
  useEffect(() => {
    if (isAuthenticated && initializeData && user) {
      initializeData(user.username)
    } else if (!isAuthenticated && resetData) {
      resetData()
    }
  }, [isAuthenticated, initializeData, resetData, user])

  // Show login/register screen if not authenticated
  if (!isAuthenticated && !authLoading) {
    if (showRegister) {
      return (
        <Register 
          onRegisterSuccess={() => {
            setShowRegister(false)
            // The user is automatically logged in after registration
            // The auth context will update and show the main app
          }}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      )
    }
    return (
      <Login 
        onSwitchToRegister={() => setShowRegister(true)}
      />
    )
  }

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'calendars', label: 'My Calendars', icon: CalendarDays },
    { id: 'today', label: 'Today', icon: CheckSquare },
  ]

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your calendar data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load data</p>
          <p className="text-gray-500 text-sm">Please make sure the backend is running on localhost:8000</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">GV</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Good Vibes
              </h1>
              <p className="text-gray-600 text-sm">Your mindful calendar companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-gray-600 mr-4">
              <User className="w-4 h-4" />
              <span className="text-sm">Welcome, {user?.username}</span>
            </div>
            
            <button
              onClick={() => setShowTodoCreator(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Todo</span>
            </button>
            
            <button
              onClick={logout}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'calendars' && <MultiCalendarView />}
          {activeTab === 'today' && <TodayView />}
        </div>
      </div>

      {/* Modals */}
      {showTodoCreator && (
        <TodoCreator onClose={() => setShowTodoCreator(false)} />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <TodoProvider>
        <AppContent />
      </TodoProvider>
    </AuthProvider>
  )
}

export default App 