import React, { useState } from 'react'
import { format, isToday, startOfDay } from 'date-fns'
import { useTodos } from '../contexts/TodoContext'
import TodoItem from './TodoItem'
import { CheckCircle, Circle, Calendar } from 'lucide-react'

function TodayView() {
  const { todos, calendars } = useTodos()
  const [showCompleted, setShowCompleted] = useState(false)

  const today = new Date()

  // Helper function to safely parse date strings and ensure local timezone
  const parseTaskDate = (dateString) => {
    if (!dateString) return null
    if (dateString instanceof Date) return dateString
    const localDateString = dateString.includes('T') ? dateString : `${dateString}T12:00:00`
    return new Date(localDateString)
  }

  // Helper function to migrate legacy tasks with dueDate to startDate/endDate format
  const migrateLegacyTask = (todo) => {
    // If task has dueDate but no startDate/endDate, migrate it
    if (todo.dueDate && !todo.startDate && !todo.endDate) {
      const dateString = todo.dueDate.includes('T') ? todo.dueDate.split('T')[0] : todo.dueDate
      return {
        ...todo,
        startDate: dateString,
        endDate: dateString,
        dueDate: null // Clear the old field
      }
    }
    return todo
  }

  const todayTodos = todos.map(migrateLegacyTask).filter(todo => {
    // All tasks now have startDate and endDate
    if (todo.startDate && todo.endDate) {
      const startDate = parseTaskDate(todo.startDate)
      const endDate = parseTaskDate(todo.endDate)
      if (startDate && endDate) {
        // Use date-only comparison without time components
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        return todayOnly >= startOnly && todayOnly <= endOnly
      }
    }
    // Also include todos without dates that were created today
    return isToday(new Date(todo.createdAt))
  })

  const filteredTodos = todayTodos.filter(todo => {
    if (!showCompleted && todo.isCompleted) {
      return false
    }
    return true
  })

  const pendingTodos = filteredTodos.filter(todo => !todo.isCompleted)
  const completedTodos = filteredTodos.filter(todo => todo.isCompleted)

  // Helper function to lighten/darken colors for calendar color coding
  const lightenColor = (color, amount = 0.9) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  const darkenColor = (color, amount = 0.8) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.round(r * amount);
    const newG = Math.round(g * amount);
    const newB = Math.round(b * amount);
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  // Enhanced TodoItem component with calendar color coding
  const ColorCodedTodoItem = ({ todo, showCalendarName = false }) => {
    const calendar = calendars.find(cal => cal.id === todo.calendarId)
    
    if (!showCalendarName || !calendar) {
      return <TodoItem key={todo.id} todo={todo} />
    }
    
    const lightBg = lightenColor(calendar.color, 0.95)
    const borderColor = darkenColor(calendar.color, 0.7)
    
    return (
      <div
        key={todo.id}
        className="rounded-lg p-3 border-l-4"
        style={{
          backgroundColor: lightBg,
          borderLeftColor: borderColor,
        }}
      >
        <TodoItem todo={todo} />
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <div
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: calendar.color }}
          />
          {calendar.name}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {format(today, 'EEEE, MMMM d')}
            </h2>
            <p className="text-gray-600">Today's focus</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show completed</span>
          </label>
        </div>
      </div>

      {/* Aggregate View - All Calendars Combined */}
      {calendars.length > 0 && filteredTodos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              All Calendars
            </h3>
          </div>
          <div className="p-4">
            {/* Pending Tasks */}
            {pendingTodos.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <Circle className="w-4 h-4 mr-2 text-blue-500" />
                  Pending ({pendingTodos.length})
                </h4>
                <div className="space-y-3">
                  {pendingTodos.map(todo => (
                    <ColorCodedTodoItem key={todo.id} todo={todo} showCalendarName={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTodos.length > 0 && showCompleted && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Completed ({completedTodos.length})
                </h4>
                <div className="space-y-3">
                  {completedTodos.map(todo => (
                    <ColorCodedTodoItem key={todo.id} todo={todo} showCalendarName={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Individual Calendar Views */}
      {calendars.length > 0 && (
        <div className="space-y-6">
          {calendars.map(calendar => {
            const calendarTodos = filteredTodos.filter(todo => todo.calendarId === calendar.id)
            const calendarPending = calendarTodos.filter(todo => !todo.isCompleted)
            const calendarCompleted = calendarTodos.filter(todo => todo.isCompleted)
            
            if (calendarTodos.length === 0) return null
            
            return (
              <div
                key={calendar.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                style={{ borderLeftColor: calendar.color, borderLeftWidth: '4px' }}
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: calendar.color }}
                    />
                    {calendar.name}
                  </h3>
                </div>
                <div className="p-4">
                  {/* Pending Tasks */}
                  {calendarPending.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                        <Circle className="w-4 h-4 mr-2 text-blue-500" />
                        Pending ({calendarPending.length})
                      </h4>
                      <div className="space-y-3">
                        {calendarPending.map(todo => (
                          <TodoItem key={todo.id} todo={todo} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {calendarCompleted.length > 0 && showCompleted && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Completed ({calendarCompleted.length})
                      </h4>
                      <div className="space-y-3">
                        {calendarCompleted.map(todo => (
                          <TodoItem key={todo.id} todo={todo} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredTodos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">All clear for today!</h3>
          <p className="text-gray-600 mt-2">
            No tasks scheduled for today. Add a new task to get started.
          </p>
        </div>
      )}
    </div>
  )
}

export default TodayView 