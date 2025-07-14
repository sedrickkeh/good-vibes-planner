import React, { useState } from 'react'
import { format, formatDistanceToNow, isSameDay } from 'date-fns'
import { useTodos } from '../contexts/TodoContext'
import { Check, Edit2, Trash2, Clock, Calendar, Tag, MoreVertical } from 'lucide-react'
import clsx from 'clsx'

function TodoItem({ todo, compact = false }) {
  const { updateTodo, deleteTodo, projects } = useTodos()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [showActions, setShowActions] = useState(false)

  const project = projects.find(p => p.id === todo.projectId)

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

  // Use migrated todo for all operations
  const migratedTodo = migrateLegacyTask(todo)

  const handleComplete = () => {
    updateTodo(migratedTodo.id, { isCompleted: !migratedTodo.isCompleted })
  }

  const handleEdit = () => {
    if (isEditing) {
      if (editTitle.trim() !== migratedTodo.title) {
        updateTodo(migratedTodo.id, { title: editTitle.trim() })
      }
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTodo(migratedTodo.id)
    }
  }

  const handleKeyPress = (e) => {
    e.stopPropagation() // Prevent keyboard events from bubbling up
    if (e.key === 'Enter') {
      handleEdit()
    } else if (e.key === 'Escape') {
      setEditTitle(migratedTodo.title)
      setIsEditing(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-400'
    }
  }

  const isOverdue = (() => {
    if (migratedTodo.isCompleted) return false
    
    // All tasks now have startDate and endDate - overdue if end date is past
    if (migratedTodo.startDate && migratedTodo.endDate) {
      const endDate = parseTaskDate(migratedTodo.endDate)
      return endDate && endDate < new Date()
    }
    
    return false
  })()

  return (
    <div 
      className={clsx(
        'group relative bg-white rounded-lg border transition-all duration-200 hover:shadow-md',
        {
          'border-gray-200 hover:border-gray-300': !migratedTodo.isCompleted && !isOverdue,
          'border-red-200 bg-red-50': isOverdue,
          'border-gray-200 opacity-60': migratedTodo.isCompleted,
          'p-3': compact,
          'p-4': !compact
        }
      )}
      onClick={(e) => {
        e.stopPropagation() // Prevent any clicks on the TodoItem from bubbling up
      }}
      onMouseDown={(e) => {
        e.stopPropagation() // Prevent mouse down from bubbling up
      }}
      onMouseUp={(e) => {
        e.stopPropagation() // Prevent mouse up from bubbling up
      }}
    >
      {/* Priority Indicator */}
      {migratedTodo.priority && migratedTodo.priority !== 'none' && (
        <div className={clsx(
          'absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-full',
          {
            'bg-red-500': migratedTodo.priority === 'high',
            'bg-yellow-500': migratedTodo.priority === 'medium',
            'bg-green-500': migratedTodo.priority === 'low'
          }
        )} />
      )}

      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleComplete()
          }}
          className={clsx(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            {
              'border-gray-300 hover:border-blue-500': !migratedTodo.isCompleted,
              'border-green-500 bg-green-500': migratedTodo.isCompleted
            }
          )}
        >
          {migratedTodo.isCompleted && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center justify-between">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleEdit}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-sm font-medium bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h3 className={clsx(
                'text-sm font-medium',
                {
                  'text-gray-900': !migratedTodo.isCompleted,
                  'text-gray-500 line-through': migratedTodo.isCompleted
                }
              )}>
                {migratedTodo.title}
              </h3>
            )}

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActions(!showActions)
                }}
                className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {/* Actions Dropdown */}
              {showActions && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit()
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Edit2 className="w-3 h-3 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {migratedTodo.description && (
            <p className="text-xs text-gray-600 mt-1">
              {migratedTodo.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            {/* Date Display */}
            {migratedTodo.startDate && migratedTodo.endDate && (
              <span className={clsx(
                'flex items-center',
                { 'text-red-500': isOverdue }
              )}>
                <Calendar className="w-3 h-3 mr-1" />
                {(() => {
                  const startDate = parseTaskDate(migratedTodo.startDate)
                  const endDate = parseTaskDate(migratedTodo.endDate)
                  if (startDate && endDate) {
                    if (isSameDay(startDate, endDate)) {
                      return format(startDate, 'MMM d')
                    } else {
                      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
                    }
                  }
                  return 'Invalid date'
                })()}
              </span>
            )}
            
            {migratedTodo.estimatedTime && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {migratedTodo.estimatedTime}min
              </span>
            )}

            {migratedTodo.completedAt && (
              <span className="text-green-600">
                ✓ {formatDistanceToNow(new Date(migratedTodo.completedAt), { addSuffix: true })}
              </span>
            )}

            {!compact && (
              <span className="ml-auto">
                Created {formatDistanceToNow(new Date(migratedTodo.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Project Badge */}
        {project && (
          <div 
            className="flex-shrink-0 w-3 h-3 rounded-full"
            style={{ backgroundColor: project.color }}
            title={project.name}
          />
        )}
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={(e) => {
            e.stopPropagation()
            setShowActions(false)
          }}
        />
      )}
    </div>
  )
}

export default TodoItem 