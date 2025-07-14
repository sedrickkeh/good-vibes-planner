import React, { useState } from 'react'
import { useTodos } from '../contexts/TodoContext'
import WeekOverview from './WeekOverview'
import { Plus, X, Trash2, Edit2, Save, Calendar, Settings2 } from 'lucide-react'
import clsx from 'clsx'

const colorOptions = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

function MultiCalendarView() {
  const { calendars, addCalendar, updateCalendar, deleteCalendar } = useTodos()
  const [showCalendarManager, setShowCalendarManager] = useState(false)
  const [showNewCalendar, setShowNewCalendar] = useState(false)
  const [newCalendarName, setNewCalendarName] = useState('')
  const [newCalendarColor, setNewCalendarColor] = useState(colorOptions[0])
  const [editingCalendar, setEditingCalendar] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(colorOptions[0])

  const handleCreateCalendar = (e) => {
    e.preventDefault()
    if (!newCalendarName.trim()) return
    
    addCalendar({
      name: newCalendarName.trim(),
      color: newCalendarColor,
      isDefault: false
    })
    
    setNewCalendarName('')
    setNewCalendarColor(colorOptions[0])
    setShowNewCalendar(false)
  }

  const handleEditCalendar = (calendar) => {
    setEditingCalendar(calendar.id)
    setEditName(calendar.name)
    setEditColor(calendar.color)
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editName.trim()) return
    
    updateCalendar(editingCalendar, {
      name: editName.trim(),
      color: editColor
    })
    
    setEditingCalendar(null)
    setEditName('')
    setEditColor(colorOptions[0])
  }

  const handleDeleteCalendar = (calendarId) => {
    const calendar = calendars.find(c => c.id === calendarId)
    
    if (calendars.length === 1) {
      alert('Cannot delete the last remaining calendar. You must have at least one calendar.')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete "${calendar.name}"? This will also delete all tasks in this calendar.`)) {
      deleteCalendar(calendarId)
    }
  }

  const handleCancelEdit = () => {
    setEditingCalendar(null)
    setEditName('')
    setEditColor(colorOptions[0])
  }

  return (
    <div className="space-y-8">
      {/* Calendar Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Calendars</h1>
          <p className="text-gray-600">Manage multiple calendars and see all your tasks</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCalendarManager(!showCalendarManager)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Manage Calendars"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowNewCalendar(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Calendar</span>
          </button>
        </div>
      </div>

      {/* Calendar Manager */}
      {showCalendarManager && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Manage Calendars</h3>
            <button
              onClick={() => setShowCalendarManager(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {calendars.map(calendar => (
              <div
                key={calendar.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                {editingCalendar === calendar.id ? (
                  <form onSubmit={handleSaveEdit} className="flex-1 flex items-center space-x-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Calendar name"
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className={clsx(
                            'w-6 h-6 rounded-full border-2 transition-all',
                            editColor === color ? 'border-gray-600 scale-110' : 'border-gray-300'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="p-2 text-green-600 hover:text-green-700 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-2 text-gray-600 hover:text-gray-700 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <span className="font-medium text-gray-800">
                        {calendar.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditCalendar(calendar)}
                        className="p-2 text-blue-600 hover:text-blue-700 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCalendar(calendar.id)}
                        className="p-2 text-red-600 hover:text-red-700 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Calendar Modal */}
      {showNewCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Calendar</h3>
            <form onSubmit={handleCreateCalendar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calendar Name
                </label>
                <input
                  type="text"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="Enter calendar name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCalendarColor(color)}
                      className={clsx(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        newCalendarColor === color ? 'border-gray-600 scale-110' : 'border-gray-300'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewCalendar(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aggregate Calendar (All Calendars) */}
      {calendars.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <WeekOverview calendar={null} showHeader={true} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Good Vibes!</h3>
          <p className="text-gray-600 mb-6">
            Create your first calendar to start organizing your tasks and events.
          </p>
          <button
            onClick={() => setShowNewCalendar(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Calendar</span>
          </button>
        </div>
      )}

      {/* Individual Calendars */}
      {calendars.length > 0 && (
        <div className="space-y-6">
          {calendars.map(calendar => (
            <div
              key={calendar.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              style={{ borderLeftColor: calendar.color, borderLeftWidth: '4px' }}
            >
              <WeekOverview calendar={calendar} showHeader={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MultiCalendarView 