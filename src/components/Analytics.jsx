import React, { useState } from 'react'
import { useTodos } from '../contexts/TodoContext'
import { X, BarChart3, TrendingUp, Clock, CheckCircle, Calendar, Target } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns'

function Analytics({ onClose }) {
  const { todos, projects } = useTodos()
  const [timeRange, setTimeRange] = useState('week') // week, month, all

  const getDateRange = () => {
    const now = new Date()
    switch (timeRange) {
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        }
      case 'month':
        return {
          start: subDays(now, 30),
          end: now
        }
      default:
        return {
          start: new Date(2020, 0, 1),
          end: now
        }
    }
  }

  const { start, end } = getDateRange()

  const getFilteredTodos = () => {
    if (timeRange === 'all') return todos
    
    return todos.filter(todo => {
      const todoDate = new Date(todo.createdAt)
      return isWithinInterval(todoDate, { start, end })
    })
  }

  const filteredTodos = getFilteredTodos()

  // Basic Stats
  const totalTodos = filteredTodos.length
  const completedTodos = filteredTodos.filter(todo => todo.isCompleted).length
  const pendingTodos = totalTodos - completedTodos
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  // Time-based stats
  const totalEstimatedTime = filteredTodos.reduce((sum, todo) => sum + (todo.estimatedTime || 0), 0)
  const completedEstimatedTime = filteredTodos
    .filter(todo => todo.isCompleted)
    .reduce((sum, todo) => sum + (todo.estimatedTime || 0), 0)

  // Project stats
  const projectStats = projects.map(project => {
    const projectTodos = filteredTodos.filter(todo => todo.projectId === project.id)
    const completed = projectTodos.filter(todo => todo.isCompleted).length
    const total = projectTodos.length
    
    return {
      ...project,
      totalTodos: total,
      completedTodos: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      estimatedTime: projectTodos.reduce((sum, todo) => sum + (todo.estimatedTime || 0), 0)
    }
  }).filter(stat => stat.totalTodos > 0)

  // Priority stats
  const priorityStats = ['high', 'medium', 'low'].map(priority => {
    const priorityTodos = filteredTodos.filter(todo => todo.priority === priority)
    const completed = priorityTodos.filter(todo => todo.isCompleted).length
    
    return {
      priority,
      total: priorityTodos.length,
      completed,
      completionRate: priorityTodos.length > 0 ? Math.round((completed / priorityTodos.length) * 100) : 0
    }
  }).filter(stat => stat.total > 0)

  // Daily completion trend (for week/month view)
  const getDailyStats = () => {
    if (timeRange === 'all') return []
    
    const days = eachDayOfInterval({ start, end })
    return days.map(day => {
      const dayTodos = todos.filter(todo => {
        const todoDate = new Date(todo.createdAt)
        return format(todoDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      })
      
      const dayCompleted = todos.filter(todo => {
        if (!todo.completedAt) return false
        const completedDate = new Date(todo.completedAt)
        return format(completedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      })

      return {
        date: format(day, 'MMM d'),
        created: dayTodos.length,
        completed: dayCompleted.length
      }
    })
  }

  const dailyStats = getDailyStats()

  // Most productive day
  const mostProductiveDay = dailyStats.reduce((max, day) => 
    day.completed > max.completed ? day : max, { completed: 0, date: 'N/A' })

  // Common patterns
  const getTopPatterns = () => {
    const patterns = {}
    
    filteredTodos.forEach(todo => {
      const words = todo.title.toLowerCase().split(' ')
      words.forEach(word => {
        if (word.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'use', 'man', 'new', 'now', 'way', 'may', 'say'].includes(word)) {
          patterns[word] = (patterns[word] || 0) + 1
        }
      })
    })
    
    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
  }

  const topPatterns = getTopPatterns()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-500" />
              Analytics Dashboard
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'all', label: 'All Time' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeRange === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-blue-700">{totalTodos}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-700">{completedTodos}</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-yellow-700">{completionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Time Saved</p>
                  <p className="text-2xl font-bold text-purple-700">{Math.round(completedEstimatedTime / 60)}h</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            {dailyStats.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  Daily Activity
                </h3>
                <div className="space-y-3">
                  {dailyStats.map(day => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{day.date}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">{day.created} created</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">{day.completed} completed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {mostProductiveDay.completed > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Most productive day:</strong> {mostProductiveDay.date} ({mostProductiveDay.completed} completed)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Project Performance */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Project Performance</h3>
              <div className="space-y-4">
                {projectStats.map(project => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{project.completionRate}%</div>
                      <div className="text-xs text-gray-500">
                        {project.completedTodos}/{project.totalTodos} tasks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Breakdown */}
            {priorityStats.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Priority Breakdown</h3>
                <div className="space-y-3">
                  {priorityStats.map(stat => (
                    <div key={stat.priority} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          stat.priority === 'high' ? 'bg-red-500' :
                          stat.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="font-medium capitalize">{stat.priority}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{stat.completionRate}%</div>
                        <div className="text-xs text-gray-500">
                          {stat.completed}/{stat.total} tasks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Patterns */}
            {topPatterns.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Common Task Patterns</h3>
                <div className="space-y-2">
                  {topPatterns.map(pattern => (
                    <div key={pattern.word} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{pattern.word}</span>
                      <span className="text-sm text-gray-500">{pattern.count} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Quick Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-700">
                  <strong>Productivity:</strong> You've completed {completedTodos} tasks with a {completionRate}% success rate.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Time Management:</strong> {Math.round(completedEstimatedTime / 60)} hours of estimated work completed.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Project Focus:</strong> Most active project is {projectStats[0]?.name || 'N/A'}.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Task Distribution:</strong> {pendingTodos} tasks remaining to complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics 