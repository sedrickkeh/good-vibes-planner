import React, { useState } from 'react'
import { useTodos } from '../contexts/TodoContext'
import { X, Calendar, Repeat, Save, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

function TodoCreator({ onClose }) {
  const { addTodo, templates, addTemplate, calendars } = useTodos()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    estimatedTime: '',
    calendarId: calendars.length > 0 ? calendars[0].id : '',
    isRecurring: false,
    recurringPattern: 'daily',
    recurringCount: 1
  })
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const todoData = {
      ...formData,
      title: formData.title.trim(),
      estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null
    }

    if (saveAsTemplate && templateName.trim()) {
      addTemplate({
        ...todoData,
        name: templateName.trim(),
        templateId: Date.now().toString()
      })
    }

    if (formData.isRecurring && formData.recurringCount > 1) {
      // Create multiple todos for recurring tasks
      for (let i = 0; i < formData.recurringCount; i++) {
        let adjustedTodoData = { ...todoData }
        
        if (formData.startDate && formData.endDate) {
          // For recurring tasks, shift both start and end dates
          const startDate = new Date(formData.startDate)
          const endDate = new Date(formData.endDate)
          
          if (formData.recurringPattern === 'daily') {
            startDate.setDate(startDate.getDate() + i)
            endDate.setDate(endDate.getDate() + i)
          } else if (formData.recurringPattern === 'weekly') {
            startDate.setDate(startDate.getDate() + (i * 7))
            endDate.setDate(endDate.getDate() + (i * 7))
          } else if (formData.recurringPattern === 'monthly') {
            startDate.setMonth(startDate.getMonth() + i)
            endDate.setMonth(endDate.getMonth() + i)
          }
          
          adjustedTodoData.startDate = startDate.toISOString().split('T')[0]
          adjustedTodoData.endDate = endDate.toISOString().split('T')[0]
        }
        
        adjustedTodoData.title = `${todoData.title}${i > 0 ? ` (${i + 1})` : ''}`
        addTodo(adjustedTodoData)
      }
    } else {
      addTodo(todoData)
    }

    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTemplateSelect = (template) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description || '',
      startDate: template.startDate || '',
      endDate: template.endDate || '',
      estimatedTime: template.estimatedTime || '',
      calendarId: template.calendarId || (calendars.length > 0 ? calendars[0].id : '')
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Quick Start Templates
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add more details..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Date Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Task Schedule
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Set the same date for both fields to create a single-day task
            </p>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => handleChange('estimatedTime', e.target.value)}
              placeholder="30"
              min="5"
              step="5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Calendar Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </label>
            {calendars.length > 0 ? (
              <select
                value={formData.calendarId}
                onChange={(e) => handleChange('calendarId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {calendars.map(calendar => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                No calendars available. Create a calendar first in the "My Calendars" tab.
              </div>
            )}
          </div>

          {/* Recurring Options */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => handleChange('isRecurring', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                <Repeat className="w-4 h-4 inline mr-1" />
                Make this a recurring task
              </label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pattern</label>
                  <select
                    value={formData.recurringPattern}
                    onChange={(e) => handleChange('recurringPattern', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Count</label>
                  <input
                    type="number"
                    value={formData.recurringCount}
                    onChange={(e) => handleChange('recurringCount', parseInt(e.target.value))}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save as Template */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="saveAsTemplate"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="saveAsTemplate" className="text-sm font-medium text-gray-700">
                <Save className="w-4 h-4 inline mr-1" />
                Save as template for future use
              </label>
            </div>

            {saveAsTemplate && (
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TodoCreator 