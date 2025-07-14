import React, { useState } from 'react'
import { Calendar, CheckSquare, Plus, Settings, BarChart3, CalendarDays, AlertCircle, Loader2 } from 'lucide-react'
import TodayView from './components/TodayView'
import MultiCalendarView from './components/MultiCalendarView'
import TodoCreator from './components/TodoCreator'
import ProjectManager from './components/ProjectManager'
import Analytics from './components/Analytics'
import { TodoProvider, useTodos } from './contexts/TodoContext'

function AppContent() {
  const { loading, error } = useTodos()
  const [activeTab, setActiveTab] = useState('calendars')
  const [showTodoCreator, setShowTodoCreator] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

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
            <button
              onClick={() => setShowAnalytics(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Analytics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowProjectManager(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Manage Projects"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTodoCreator(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Todo</span>
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
      {showProjectManager && (
        <ProjectManager onClose={() => setShowProjectManager(false)} />
      )}
      {showAnalytics && (
        <Analytics onClose={() => setShowAnalytics(false)} />
      )}
    </div>
  )
}

function App() {
  return (
    <TodoProvider>
      <AppContent />
    </TodoProvider>
  )
}

export default App 