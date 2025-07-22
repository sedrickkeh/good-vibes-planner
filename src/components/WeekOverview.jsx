import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { format, startOfWeek, addDays, isSameDay, isToday, subDays } from 'date-fns'
import { useTodos } from '../contexts/TodoContext'
import TodoItem from './TodoItem'
import { Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

function WeekOverview({ calendar = null, showHeader = true }) {
  const { todos, addTodo, updateTodo, deleteTodo, calendars } = useTodos()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddData, setQuickAddData] = useState({ 
    date: null, 
    title: '', 
    description: '',
    startDate: '',
    endDate: ''
  })
  const [draggedTask, setDraggedTask] = useState(null)
  
  // Date navigation state
  const [centerDate, setCenterDate] = useState(new Date())
  
  // New state for drag-to-create multi-day tasks
  const [isCreatingMultiDay, setIsCreatingMultiDay] = useState(false)
  const [multiDaySelection, setMultiDaySelection] = useState({ startDay: null, endDay: null })
  const [isDraggingToCreate, setIsDraggingToCreate] = useState(false)

  // New state for double-tap resize mode
  const [isInResizeMode, setIsInResizeMode] = useState(false)
  const [resizeModeTask, setResizeModeTask] = useState(null)
  const [lastTapTime, setLastTapTime] = useState(0)
  const [tapTarget, setTapTarget] = useState(null)

  // New state for tracking drag-to-extend functionality
  const [dragStartDay, setDragStartDay] = useState(null)
  const [dragEndDay, setDragEndDay] = useState(null)
  const [isDraggingToExtend, setIsDraggingToExtend] = useState(false)
  const [isDragEnded, setIsDragEnded] = useState(false)
  const [recentlyCreatedTask, setRecentlyCreatedTask] = useState(false)

  // Context menu and edit modal state
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuTask, setContextMenuTask] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTaskData, setEditTaskData] = useState({
    id: null,
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    calendarId: ''
  })

  const today = new Date()
  
  // Calculate week with centerDate as the 3rd day (index 2)
  const weekStart = subDays(centerDate, 2) // 2 days before center date
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Navigation functions
  const goToPreviousWeek = () => {
    setCenterDate(prev => subDays(prev, 7))
  }

  const goToNextWeek = () => {
    setCenterDate(prev => addDays(prev, 7))
  }

  const goToToday = () => {
    setCenterDate(new Date())
  }

  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value + 'T12:00:00')
    setCenterDate(selectedDate)
  }

  // Filter todos by calendar
  const filteredTodos = calendar 
    ? todos.filter(todo => todo.calendarId === calendar.id)
    : todos // Show all todos if no calendar specified (for aggregate view)

  // Add global mouse event handlers
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      // Only reset drag-to-create state if we're actually dragging and clicking outside calendar
      if (isDraggingToCreate && !e.target.closest('[data-day-column]') && !e.target.closest('.todo-item')) {
        setIsDraggingToCreate(false)
        setIsCreatingMultiDay(false)
        setMultiDaySelection({ startDay: null, endDay: null })
      }
      
      // Reset drag-to-extend state for task movement
      if (isDraggingToExtend || dragStartDay || dragEndDay) {
        setDragStartDay(null)
        setDragEndDay(null)
        setIsDraggingToExtend(false)
        setIsDragEnded(false)
      }
    }

    const handleGlobalMouseMove = (e) => {
      // Prevent text selection during drag
      if (isDraggingToCreate || isDraggingToExtend) {
        e.preventDefault()
      }
    }

    // Only add global handlers if we're actually in a drag state
    if (isDraggingToCreate || isDraggingToExtend || dragStartDay) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('mousemove', handleGlobalMouseMove)
      
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp)
        document.removeEventListener('mousemove', handleGlobalMouseMove)
      }
    }
  }, [isDraggingToCreate, isDraggingToExtend, dragStartDay, dragEndDay, isCreatingMultiDay, multiDaySelection])

  // Helper function to safely parse date strings and ensure local timezone
  const parseTaskDate = (dateString) => {
    if (!dateString) return null
    if (dateString instanceof Date) return dateString
    const localDateString = dateString.includes('T') ? dateString : `${dateString}T12:00:00`
    const result = new Date(localDateString)
    return result
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

  // Get all tasks for a specific date
  const getTodosForDate = (date) => {
    return filteredTodos.map(migrateLegacyTask).filter(todo => {
      if (todo.startDate && todo.endDate) {
        const startDate = parseTaskDate(todo.startDate)
        const endDate = parseTaskDate(todo.endDate)
        if (startDate && endDate) {
          // Use date comparison without time to ensure proper matching
          const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
          return dateOnly >= startOnly && dateOnly <= endOnly
        }
      }
      return false
    })
  }

  // Get all tasks for rendering as bars across the week
  const getAllTasks = useMemo(() => {
    const tasks = filteredTodos.map(migrateLegacyTask).filter(todo => {
      // Include all tasks that have startDate and endDate
      return todo.startDate && todo.endDate
    })
      .map(todo => {
        const effectiveStartDate = parseTaskDate(todo.startDate)
        const effectiveEndDate = parseTaskDate(todo.endDate)
        
        if (!effectiveStartDate || !effectiveEndDate) return null
        
        // First check if task overlaps with current week at all
        const weekStartDate = weekDays[0]
        const weekEndDate = weekDays[6]
        
        // Task must end on or after week start AND start on or before week end
        if (effectiveEndDate < weekStartDate || effectiveStartDate > weekEndDate) {
          return null // Task doesn't overlap with current week
        }
        
        // Find which day columns this task spans
        let startDayIndex = -1
        let endDayIndex = -1
        
        for (let i = 0; i < weekDays.length; i++) {
          const weekDay = weekDays[i]
          
          // Check if task starts on this day
          if (startDayIndex === -1 && isSameDay(effectiveStartDate, weekDay)) {
            startDayIndex = i
          }
          
          // Check if task ends on this day
          if (isSameDay(effectiveEndDate, weekDay)) {
            endDayIndex = i
          }
          
          // If task spans this day (between start and end)
          if (effectiveStartDate <= weekDay && weekDay <= effectiveEndDate) {
            if (startDayIndex === -1) startDayIndex = i
            endDayIndex = i
          }
        }
        
        // If task starts before this week, start from beginning of week
        if (startDayIndex === -1 && effectiveStartDate < weekDays[0]) {
          startDayIndex = 0
        }
        
        // If task ends after this week, end at end of week
        if (endDayIndex === -1 && effectiveEndDate > weekDays[6]) {
          endDayIndex = 6
        }
        
        // Ensure we have valid indices
        if (startDayIndex === -1) startDayIndex = 0
        if (endDayIndex === -1) endDayIndex = 6
        if (startDayIndex < 0) startDayIndex = 0
        if (endDayIndex > 6) endDayIndex = 6
        if (startDayIndex > endDayIndex) return null
        
        return {
          ...todo,
          startDayIndex,
          endDayIndex,
          spanWidth: endDayIndex - startDayIndex + 1,
          effectiveStartDate,
          effectiveEndDate
        }
      })
      .filter(Boolean)
    
    // Simple row assignment: assign each task to the first available row
    const rows = []
    
    tasks.forEach(task => {
      // Find the first row where this task doesn't overlap
      let assignedRow = 0
      
      while (assignedRow < rows.length) {
        const rowTasks = rows[assignedRow]
        const hasConflict = rowTasks.some(existingTask => {
          // Check if date ranges overlap
          return !(task.startDayIndex > existingTask.endDayIndex || existingTask.startDayIndex > task.endDayIndex)
        })
        
        if (!hasConflict) {
          break // Found an available row
        }
        assignedRow++
      }
      
      // Create new row if needed
      if (assignedRow >= rows.length) {
        rows.push([])
      }
      
      // Add task to the row
      rows[assignedRow].push(task)
      task.row = assignedRow
    })
    
    return tasks
  }, [filteredTodos, weekDays])

  // Handle quick add submission
  const handleQuickAddSubmit = (e) => {
    e.preventDefault()
    if (!quickAddData.title.trim()) return
    
    const todoData = {
      title: quickAddData.title,
      description: quickAddData.description,
      startDate: quickAddData.startDate,
      endDate: quickAddData.endDate,
      calendarId: calendar ? calendar.id : 'main'
    }
    
    addTodo(todoData)
    
    // Set cooldown period to prevent accidental resize triggering
    setRecentlyCreatedTask(true)
    setTimeout(() => {
      setRecentlyCreatedTask(false)
    }, 500)
    
    setShowQuickAdd(false)
    setQuickAddData({ 
      date: null, 
      title: '', 
      description: '',
      startDate: '',
      endDate: ''
    })
  }

  // Handle task drag start
  const handleTaskDragStart = useCallback((e, todo) => {
    const migratedTodo = migrateLegacyTask(todo)
    setDraggedTask(migratedTodo)
    e.dataTransfer.setData('text/plain', migratedTodo.id)
    e.dataTransfer.effectAllowed = 'move'
    
    // Find the current start day of the task to track drag start position
    let currentDay = null
    if (migratedTodo.startDate) {
      const taskDate = parseTaskDate(migratedTodo.startDate)
      currentDay = weekDays.find(day => taskDate && isSameDay(taskDate, day))
    }
    
    setDragStartDay(currentDay)
    setDragEndDay(currentDay)
    setIsDraggingToExtend(false)
    setIsDragEnded(false)
  }, [weekDays])

  // Handle drag end - reset all drag states
  const handleTaskDragEnd = useCallback((e) => {
    setIsDragEnded(true)
    
    // Use a timeout to ensure all drag events have finished
    setTimeout(() => {
      setDraggedTask(null)
      setDragStartDay(null)
      setDragEndDay(null)
      setIsDraggingToExtend(false)
      setIsDragEnded(false)
    }, 100)
  }, [])

  // Handle drag and drop for moving tasks
  const handleTaskDrop = useCallback((e, targetDate) => {
    e.preventDefault()
    e.stopPropagation()
    
    const taskId = e.dataTransfer.getData('text/plain')
    const task = filteredTodos.find(t => t.id === taskId)
    
    if (task && dragStartDay) {
      const migratedTask = migrateLegacyTask(task)
      
      // Check if we're dragging across multiple days
      const startDay = dragStartDay
      const endDay = dragEndDay || targetDate
      
      // Ensure start is before end
      const actualStartDay = startDay <= endDay ? startDay : endDay
      const actualEndDay = startDay <= endDay ? endDay : startDay
      
      const startDateString = format(actualStartDay, 'yyyy-MM-dd')
      const endDateString = format(actualEndDay, 'yyyy-MM-dd')
      
      updateTodo(taskId, {
        startDate: startDateString,
        endDate: endDateString
      })
      
      if (isSameDay(actualStartDay, actualEndDay)) {
        console.log(`Task "${migratedTask.title}" moved to ${format(actualStartDay, 'MMM d')}`)
      } else {
        console.log(`Task "${migratedTask.title}" extended to span ${format(actualStartDay, 'MMM d')} - ${format(actualEndDay, 'MMM d')}`)
      }
    }
    
    // Reset drag state
    setDraggedTask(null)
    setDragStartDay(null)
    setDragEndDay(null)
    setIsDraggingToExtend(false)
  }, [filteredTodos, updateTodo, dragStartDay, dragEndDay])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragEnter = useCallback((e, day) => {
    e.preventDefault()
    
    // Don't update drag state if drag has ended
    if (isDragEnded) {
      return
    }
    
    // Track the day we're dragging over for multi-day conversion
    if (draggedTask && dragStartDay) {
      setDragEndDay(day)
      setIsDraggingToExtend(!isSameDay(dragStartDay, day))
    }
  }, [draggedTask, dragStartDay, isDragEnded])

  // New functions for drag-to-create multi-day tasks
  const handleDayMouseDown = useCallback((day, e) => {
    // Only start if clicking on empty space (not on tasks or interactive elements)
    if (e.target.closest('.todo-item') || e.target.closest('button') || e.target.closest('input')) {
      return
    }
    
    setMultiDaySelection({ startDay: day, endDay: day })
  }, [])

  const handleDayMouseEnter = useCallback((day) => {
    // Only update selection if we have a start day and are dragging
    if (multiDaySelection.startDay && isDraggingToCreate) {
      setMultiDaySelection(prev => ({ ...prev, endDay: day }))
    }
  }, [multiDaySelection.startDay, isDraggingToCreate])

  const handleDayClick = useCallback((day, e) => {
    // Handle direct clicks (not drag-to-create)
    if (e.target.closest('.todo-item') || e.target.closest('button') || e.target.closest('input')) {
      return
    }
    
    const dateString = format(day, 'yyyy-MM-dd')
    setQuickAddData({
      date: day,
      title: '',
      description: '',
      startDate: dateString,
      endDate: dateString
    })
    
    setShowQuickAdd(true)
  }, [])

  const handleDayMouseUp = useCallback((day, e) => {
    // Only handle drag-to-create if we were actually dragging
    if (isDraggingToCreate && multiDaySelection.startDay) {
      const startDay = multiDaySelection.startDay
      const endDay = day
      
      // Ensure startDay is before endDay
      const actualStartDay = startDay <= endDay ? startDay : endDay
      const actualEndDay = startDay <= endDay ? endDay : startDay
      
      const startDateString = format(actualStartDay, 'yyyy-MM-dd')
      const endDateString = format(actualEndDay, 'yyyy-MM-dd')
      
      setQuickAddData({
        date: actualStartDay,
        title: '',
        description: '',
        startDate: startDateString,
        endDate: endDateString
      })
      
      setShowQuickAdd(true)
    }
    
    // Reset state
    setIsCreatingMultiDay(false)
    setIsDraggingToCreate(false)
    setMultiDaySelection({ startDay: null, endDay: null })
  }, [isDraggingToCreate, multiDaySelection])

  // Helper function to check if a day is in the current selection
  const isDayInSelection = (day) => {
    if (!multiDaySelection.startDay || !multiDaySelection.endDay) return false
    
    const startDay = multiDaySelection.startDay <= multiDaySelection.endDay ? multiDaySelection.startDay : multiDaySelection.endDay
    const endDay = multiDaySelection.startDay <= multiDaySelection.endDay ? multiDaySelection.endDay : multiDaySelection.startDay
    
    return day >= startDay && day <= endDay && isDraggingToCreate
  }

  const allTasks = getAllTasks
  const maxLanes = allTasks.length > 0 ? Math.max(...allTasks.map(task => task.row)) + 1 : 0

  // Handle double-tap detection for tasks
  const handleTaskDoubleTap = useCallback((e, task) => {
    e.preventDefault()
    e.stopPropagation()
    
    const now = Date.now()
    const timeDiff = now - lastTapTime
    const isSameTarget = tapTarget === task.id
    
    setLastTapTime(now)
    setTapTarget(task.id)
    
    // Double-tap detected (within 300ms and same target)
    if (timeDiff < 300 && isSameTarget) {
      if (isInResizeMode && resizeModeTask?.id === task.id) {
        // Exit resize mode
        setIsInResizeMode(false)
        setResizeModeTask(null)
      } else {
        // Enter resize mode
        setIsInResizeMode(true)
        setResizeModeTask(task)
      }
    }
  }, [lastTapTime, tapTarget, isInResizeMode, resizeModeTask])

  // Handle day clicks during resize mode
  const handleResizeDayClick = useCallback((e, day) => {
    if (!isInResizeMode || !resizeModeTask) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const currentStartDate = parseTaskDate(resizeModeTask.startDate)
    const currentEndDate = parseTaskDate(resizeModeTask.endDate)
    
    // Determine if we should extend start or end
    let newStartDate = currentStartDate
    let newEndDate = currentEndDate
    
    if (day < currentStartDate) {
      // Extending backwards (new start date)
      newStartDate = day
    } else if (day > currentEndDate) {
      // Extending forwards (new end date)
      newEndDate = day
    } else {
      // Day is within current range - shrink to this day
      // If closer to start, make it the new start
      // If closer to end, make it the new end
      const dayTime = day.getTime()
      const startTime = currentStartDate.getTime()
      const endTime = currentEndDate.getTime()
      const distanceToStart = Math.abs(dayTime - startTime)
      const distanceToEnd = Math.abs(dayTime - endTime)
      
      if (distanceToStart < distanceToEnd) {
        newStartDate = day
      } else {
        newEndDate = day
      }
    }
    
    // Ensure start is not after end
    if (newStartDate > newEndDate) {
      [newStartDate, newEndDate] = [newEndDate, newStartDate]
    }
    
    // Update the task
    const startDateString = format(newStartDate, 'yyyy-MM-dd')
    const endDateString = format(newEndDate, 'yyyy-MM-dd')
    
    updateTodo(resizeModeTask.id, {
      startDate: startDateString,
      endDate: endDateString
    })
    
    // Update the resize mode task with new dates
    setResizeModeTask({
      ...resizeModeTask,
      startDate: startDateString,
      endDate: endDateString
    })
  }, [isInResizeMode, resizeModeTask, updateTodo])

  // Context menu handlers
  const handleTaskRightClick = useCallback((e, task) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setContextMenuTask(task)
    setShowContextMenu(true)
  }, [])

  const handleEditTask = useCallback(() => {
    if (contextMenuTask) {
      setEditTaskData({
        id: contextMenuTask.id,
        title: contextMenuTask.title,
        description: contextMenuTask.description,
        startDate: contextMenuTask.startDate,
        endDate: contextMenuTask.endDate,
        calendarId: contextMenuTask.calendarId || 'main'
      })
      setShowEditModal(true)
    }
    setShowContextMenu(false)
  }, [contextMenuTask])

  const handleEditSubmit = useCallback((e) => {
    e.preventDefault()
    if (!editTaskData.title.trim()) return
    
    updateTodo(editTaskData.id, {
      title: editTaskData.title,
      description: editTaskData.description,
      startDate: editTaskData.startDate,
      endDate: editTaskData.endDate,
      calendarId: editTaskData.calendarId
    })
    
    setShowEditModal(false)
    setEditTaskData({
      id: null,
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      calendarId: ''
    })
  }, [editTaskData, updateTodo])

  const handleDeleteTask = useCallback(() => {
    if (contextMenuTask) {
      deleteTodo(contextMenuTask.id)
    }
    setShowContextMenu(false)
  }, [contextMenuTask, deleteTodo])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showContextMenu) {
        setShowContextMenu(false)
      }
    }
    
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [showContextMenu])

  return (
    <div className="space-y-6">
      {/* Week Board - Kanban Style */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        {showHeader && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  {calendar ? calendar.name : 'All Calendars'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </p>
              </div>
              
              {/* Navigation Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <button
                  onClick={goToToday}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isSameDay(centerDate, today)
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-600 hover:bg-blue-50'
                  )}
                >
                  Today
                </button>
                
                <button
                  onClick={goToNextWeek}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Next Week"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <div className="mx-2 w-px h-6 bg-gray-300"></div>
                
                <input
                  type="date"
                  value={format(centerDate, 'yyyy-MM-dd')}
                  onChange={handleDateChange}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Jump to Date"
                />
              </div>
            </div>
          </div>
        )}

        {/* Day Columns */}
        <div className="relative">
          {/* Drag selection overlay */}
          {isCreatingMultiDay && multiDaySelection.startDay && multiDaySelection.endDay && (
            <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
              <div className="grid grid-cols-7 gap-0 h-full">
                {weekDays.map((day, index) => (
                  <div
                    key={day.toISOString()}
                    className={clsx(
                      'border-2 border-blue-400 bg-blue-100 bg-opacity-50 rounded-lg mx-1',
                      { 'block': isDayInSelection(day), 'hidden': !isDayInSelection(day) }
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fixed Day Headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200 sticky top-0 z-30 bg-white">
            {weekDays.map((day, dayIndex) => {
              const isCurrentDay = isToday(day)
              const isCenterDay = dayIndex === 2 // The center day (3rd position)
              const isResizeClickable = isInResizeMode && resizeModeTask
              
              return (
                <div
                  key={`header-${day.toISOString()}`}
                  className={clsx(
                    'p-3 border-r border-gray-200 last:border-r-0',
                    {
                      'bg-gradient-to-r from-blue-500 to-purple-500 text-white': isCurrentDay,
                      'bg-blue-50': isCenterDay && !isCurrentDay,
                      'bg-gray-50': !isCurrentDay && !isCenterDay,
                      'border-b-2 border-b-orange-300': isResizeClickable
                    }
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={clsx('font-semibold', {
                        'text-white': isCurrentDay,
                        'text-blue-700': isCenterDay && !isCurrentDay,
                        'text-gray-800': !isCurrentDay && !isCenterDay
                      })}>
                        {format(day, 'EEE')}
                        {isResizeClickable && <span className="ml-1 text-orange-500">📏</span>}
                        {isCurrentDay && <span className="ml-1">•</span>}
                      </div>
                      <div className={clsx('text-sm', {
                        'text-blue-100': isCurrentDay,
                        'text-blue-600': isCenterDay && !isCurrentDay,
                        'text-gray-600': !isCurrentDay && !isCenterDay
                      })}>
                        {format(day, 'MMM d')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const dateString = format(day, 'yyyy-MM-dd')
                          setQuickAddData({ 
                            date: day, 
                            title: '', 
                            description: '',
                            startDate: dateString,
                            endDate: dateString
                          })
                          setShowQuickAdd(true)
                        }}
                        className={clsx(
                          'p-1 rounded transition-colors',
                          {
                            'text-white hover:bg-white/20': isCurrentDay,
                            'text-blue-600 hover:text-blue-700 hover:bg-blue-100': isCenterDay && !isCurrentDay,
                            'text-gray-400 hover:text-blue-500 hover:bg-blue-50': !isCurrentDay && !isCenterDay
                          }
                        )}
                        title="Add task"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scrollable Content Area */}
          <div className="relative overflow-y-auto" style={{ minHeight: `${Math.max(250, maxLanes * 25 + 50)}px`, height: '400px' }}>
            {/* Invisible clickable areas for each day - positioned below tasks */}
            <div className="absolute inset-0 z-0">
              <div className="grid grid-cols-7 gap-0 h-full">
                {weekDays.map((day, dayIndex) => {
                  const isCurrentDay = isToday(day)
                  const isResizeClickable = isInResizeMode && resizeModeTask
                  const isInSelection = isDayInSelection(day)
                  const isDragTarget = draggedTask && (() => {
                    const migratedTask = migrateLegacyTask(draggedTask)
                    // Always allow dropping
                    return true
                  })()
                  
                  // Check if this day is part of the drag-to-extend range
                  const isInDragExtendRange = isDraggingToExtend && dragStartDay && dragEndDay && (() => {
                    const startDay = dragStartDay <= dragEndDay ? dragStartDay : dragEndDay
                    const endDay = dragStartDay <= dragEndDay ? dragEndDay : dragStartDay
                    return day >= startDay && day <= endDay
                  })()
                  
                  return (
                    <div
                      key={`clickable-${day.toISOString()}`}
                      data-day-column
                      data-day-index={dayIndex}
                      className={clsx(
                        'border-r border-gray-200 last:border-r-0 h-full',
                        {
                          'bg-blue-50': isCurrentDay && !isInSelection && !isInDragExtendRange && !isResizeClickable,
                          'bg-white': !isCurrentDay && !isDragTarget && !isInSelection && !isInDragExtendRange && !isResizeClickable,
                          'bg-green-50': isDragTarget && !isInSelection && !isInDragExtendRange && !isResizeClickable,
                          'bg-blue-100': isInSelection,
                          'bg-purple-100 border-purple-300': isInDragExtendRange,
                          'bg-orange-50 border-orange-200 cursor-pointer hover:bg-orange-100': isResizeClickable
                        }
                      )}
                      onDrop={(e) => handleTaskDrop(e, day)}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, day)}
                      onClick={(e) => {
                        // Handle resize clicks
                        if (isResizeClickable) {
                          handleResizeDayClick(e, day)
                        }
                        // Handle regular clicks for task creation
                        else if (!isInResizeMode && !isDraggingToCreate && !isCreatingMultiDay) {
                          handleDayClick(day, e)
                        }
                      }}
                      onMouseDown={(e) => {
                        if (!isInResizeMode) {
                          handleDayMouseDown(day, e)
                        }
                      }}
                      onMouseMove={(e) => {
                        // Start dragging if we have a start day and the mouse button is pressed
                        if (multiDaySelection.startDay && e.buttons === 1 && !isDraggingToCreate) {
                          setIsDraggingToCreate(true)
                          setIsCreatingMultiDay(true)
                        }
                        
                        if (!isInResizeMode) {
                          handleDayMouseEnter(day)
                        }
                      }}
                      onMouseUp={(e) => {
                        if (!isInResizeMode && isDraggingToCreate) {
                          handleDayMouseUp(day, e)
                        }
                      }}
                    />
                  )
                })}
              </div>
            </div>

            {/* Task bars positioned within the scrollable area */}
            <div 
              className="absolute inset-0 z-10 pointer-events-none"
            >
              {allTasks.map((task, index) => {
                const leftPos = (task.startDayIndex / 7) * 100;
                const widthPos = (task.spanWidth / 7) * 100;
                const topPos = 10 + (task.row * 25);
                
                // Get calendar color for aggregate view
                const taskCalendar = calendars.find(cal => cal.id === task.calendarId);
                const isAggregateView = calendar === null;
                
                // Helper function to lighten/darken colors
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
                
                // Determine task styling based on view mode and calendar
                const getTaskStyling = () => {
                  if (isInResizeMode && resizeModeTask?.id === task.id) {
                    return {
                      className: 'bg-blue-100 border-blue-500 ring-2 ring-blue-400',
                      style: {}
                    };
                  }
                  
                  if (isAggregateView && taskCalendar) {
                    // Use calendar colors for aggregate view
                    const baseColor = taskCalendar.color;
                    const lightBg = lightenColor(baseColor, 0.85);
                    const borderColor = darkenColor(baseColor, 0.7);
                    
                    return {
                      className: task.isCompleted ? 'opacity-75' : '',
                      style: {
                        backgroundColor: lightBg,
                        borderColor: borderColor,
                        borderWidth: '1px'
                      }
                    };
                  } else {
                    // Use default gray for individual calendar views
                    return {
                      className: task.isCompleted 
                        ? 'bg-gray-100 border-gray-300 opacity-75' 
                        : 'bg-gray-100 border-gray-300',
                      style: {}
                    };
                  }
                };
                
                const taskStyling = getTaskStyling();
                
                return (
                <div
                  key={task.id}
                  className={clsx(
                    'absolute border rounded-lg p-2 shadow-sm hover:shadow-md transition-all group pointer-events-auto cursor-pointer',
                    taskStyling.className
                  )}
                  style={{
                    left: `${leftPos}%`,
                    width: `${widthPos}%`,
                    top: `${topPos}px`,
                    height: '30px',
                    marginLeft: '4px',
                    marginRight: '4px',
                    // Force positioning to work correctly
                    position: 'absolute',
                    transform: 'none',
                    margin: '0',
                    padding: '8px',
                    ...taskStyling.style
                  }}
                  draggable={!isInResizeMode}
                  onDragStart={(e) => !isInResizeMode && handleTaskDragStart(e, task)}
                  onDragEnd={handleTaskDragEnd}
                  onClick={(e) => {
                    handleTaskDoubleTap(e, task)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation() // Prevent triggering day column mouse down
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation() // Prevent triggering day column mouse up
                  }}
                  onContextMenu={(e) => {
                    handleTaskRightClick(e, task)
                  }}
                >
                  {/* Resize mode indicator */}
                  {isInResizeMode && resizeModeTask?.id === task.id && (
                    <div className="absolute -top-8 left-0 right-0 text-xs text-blue-600 font-medium text-center bg-blue-50 rounded px-2 py-1 border border-blue-200 shadow-sm z-50">
                      🔧 Resize Mode: Click days to extend/shrink • Double-tap to exit
                    </div>
                  )}

                  <div className="flex items-center justify-between h-full">
                    {/* Completion checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateTodo(task.id, { isCompleted: !task.isCompleted })
                      }}
                      className={clsx(
                        'flex-shrink-0 w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all mr-2',
                        {
                          'border-gray-300 hover:border-gray-500': !task.isCompleted,
                          'border-green-500 bg-green-500': task.isCompleted
                        }
                      )}
                    >
                      {task.isCompleted && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className={clsx(
                        'text-xs font-medium truncate',
                        {
                          'text-gray-800': !task.isCompleted,
                          'text-gray-600 line-through': task.isCompleted
                        }
                      )}>
                        {task.title}
                        {/* Show calendar name in aggregate view */}
                        {isAggregateView && taskCalendar && (
                          <span className="ml-2 text-xs opacity-75">
                            • {taskCalendar.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {quickAddData.startDate === quickAddData.endDate 
                ? `Add Task for ${format(new Date(quickAddData.startDate + 'T12:00:00'), 'MMM d')}`
                : `Add Task from ${format(new Date(quickAddData.startDate + 'T12:00:00'), 'MMM d')} to ${format(new Date(quickAddData.endDate + 'T12:00:00'), 'MMM d')}`}
            </h3>
            <form onSubmit={handleQuickAddSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={quickAddData.title}
                    onChange={(e) => setQuickAddData({ ...quickAddData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={quickAddData.description}
                    onChange={(e) => setQuickAddData({ ...quickAddData, description: e.target.value })}
                    placeholder="Add more details..."
                    rows="2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={quickAddData.startDate}
                      onChange={(e) => setQuickAddData({ ...quickAddData, startDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={quickAddData.endDate}
                      onChange={(e) => setQuickAddData({ ...quickAddData, endDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
          style={{
            left: `${contextMenuPos.x}px`,
            top: `${contextMenuPos.y}px`,
          }}
        >
          <button
            onClick={handleEditTask}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Edit Task
          </button>
          <button
            onClick={handleDeleteTask}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete Task
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={editTaskData.title}
                    onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editTaskData.description}
                    onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                    placeholder="Add more details..."
                    rows="2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label htmlFor="edit-startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="edit-startDate"
                      value={editTaskData.startDate}
                      onChange={(e) => setEditTaskData({ ...editTaskData, startDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="edit-endDate" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="edit-endDate"
                      value={editTaskData.endDate}
                      onChange={(e) => setEditTaskData({ ...editTaskData, endDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                {/* Calendar Selection */}
                {calendars.length > 0 && (
                  <div>
                    <label htmlFor="edit-calendar" className="block text-sm font-medium text-gray-700">
                      Calendar
                    </label>
                    <select
                      id="edit-calendar"
                      value={editTaskData.calendarId}
                      onChange={(e) => setEditTaskData({ ...editTaskData, calendarId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {calendars.map(cal => (
                        <option key={cal.id} value={cal.id}>
                          {cal.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeekOverview