import React, { useState } from 'react'
import { useTodos } from '../contexts/TodoContext'
import { X, Plus, Edit2, Trash2, Palette, Tag, Save } from 'lucide-react'

const colorOptions = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

function ProjectManager({ onClose }) {
  const { projects, addProject, updateProject, deleteProject, todos } = useTodos()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    color: colorOptions[0],
    description: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingId) {
      updateProject(editingId, formData)
      setEditingId(null)
    } else {
      addProject(formData)
    }

    setFormData({ name: '', color: colorOptions[0], description: '' })
    setIsCreating(false)
  }

  const handleEdit = (project) => {
    setFormData({
      name: project.name,
      color: project.color,
      description: project.description || ''
    })
    setEditingId(project.id)
    setIsCreating(true)
  }

  const handleDelete = (projectId) => {
    const todoCount = todos.filter(todo => todo.projectId === projectId).length
    
    if (todoCount > 0) {
      if (!window.confirm(`This project has ${todoCount} todos. Deleting it will also delete all associated todos. Are you sure?`)) {
        return
      }
    }

    deleteProject(projectId)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({ name: '', color: colorOptions[0], description: '' })
  }

  const getProjectStats = (projectId) => {
    const projectTodos = todos.filter(todo => todo.projectId === projectId)
    const completed = projectTodos.filter(todo => todo.isCompleted).length
    const total = projectTodos.length
    return { completed, total }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Tag className="w-6 h-6 mr-2 text-blue-500" />
              Manage Projects
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Create New Project Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Project</span>
            </button>
          )}

          {/* Create/Edit Form */}
          {isCreating && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? 'Edit Project' : 'New Project'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Project description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Update' : 'Create'} Project</span>
                </button>
              </div>
            </form>
          )}

          {/* Projects List */}
          <div className="space-y-4">
            {projects.map(project => {
              const stats = getProjectStats(project.id)
              const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

              return (
                <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h3 className="font-semibold text-gray-800">{project.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {stats.completed} of {stats.total} tasks completed
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      {completionRate}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${completionRate}%`,
                        backgroundColor: project.color
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {projects.length === 0 && !isCreating && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No projects yet. Create your first project to get organized!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectManager 