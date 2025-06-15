import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit3, Trash2, Save, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface EnhancedFeedbackModalProps {
  candidateId: string
  candidateName: string
  moduleId: string
  sessionType: string
  isOutsideClass: boolean
  editingFeedback?: {
    id: string
    feedback_text: string
    feedback_type: string
    author: string
  } | null
  onClose: () => void
  onSuccess: () => void
  onDelete?: (id: string) => void
}

export const EnhancedFeedbackModal: React.FC<EnhancedFeedbackModalProps> = ({
  candidateId,
  candidateName,
  moduleId,
  sessionType,
  isOutsideClass,
  editingFeedback,
  onClose,
  onSuccess,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    feedbackType: editingFeedback?.feedback_type || 'good',
    author: editingFeedback?.author || '',
    feedbackText: editingFeedback?.feedback_text || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (editingFeedback) {
      setFormData({
        feedbackType: editingFeedback.feedback_type,
        author: editingFeedback.author,
        feedbackText: editingFeedback.feedback_text
      })
    }
  }, [editingFeedback])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.author.trim()) newErrors.author = 'Your name is required'
    if (!formData.feedbackText.trim()) newErrors.feedbackText = 'Feedback content is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      if (editingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('feedback')
          .update({
            feedback_text: formData.feedbackText,
            feedback_type: formData.feedbackType,
            author: formData.author,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFeedback.id)
        
        if (error) throw error
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('feedback')
          .insert([{
            candidate_id: candidateId,
            module_id: moduleId,
            session_type: sessionType,
            feedback_text: formData.feedbackText,
            feedback_type: formData.feedbackType,
            author: formData.author
          }])
        
        if (error) throw error
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setErrors({ submit: 'Failed to submit feedback. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingFeedback || !onDelete) return
    
    setIsDeleting(true)
    
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', editingFeedback.id)
      
      if (error) throw error
      
      onDelete(editingFeedback.id)
      onClose()
    } catch (error) {
      console.error('Error deleting feedback:', error)
      setErrors({ submit: 'Failed to delete feedback. Please try again.' })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotateX: -15,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateX: 0,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      rotateX: 15,
      y: -50,
      transition: {
        duration: 0.2
      }
    }
  }

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ perspective: 1000 }}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <motion.h3 
                className="text-2xl font-bold text-gray-900"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {editingFeedback ? 'Edit Feedback' : 'Add New Feedback'}
              </motion.h3>
              <div className="flex gap-2">
                {editingFeedback && onDelete && (
                  <motion.button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors text-red-600"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                )}
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Feedback Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Feedback Type
                </label>
                <div className="flex gap-3">
                  {[
                    { type: 'good', label: 'Positive', color: 'green' },
                    { type: 'bad', label: 'Needs Improvement', color: 'red' },
                    { type: 'observational', label: 'Observational', color: 'yellow' }
                  ].map(({ type, label, color }) => (
                    <motion.button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, feedbackType: type })}
                      className={`flex-1 px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        formData.feedbackType === type
                          ? `bg-${color}-600 text-white shadow-lg shadow-${color}-200`
                          : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
                      }`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Author Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Your Name
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-100 bg-white/80 backdrop-blur-sm ${
                    errors.author 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder="Enter your name"
                />
                <AnimatePresence>
                  {errors.author && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.author}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Feedback Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Feedback Content
                </label>
                <textarea
                  value={formData.feedbackText}
                  onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
                  rows={5}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-100 resize-none bg-white/80 backdrop-blur-sm ${
                    errors.feedbackText 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-red-500'
                  }`}
                  placeholder="Enter your feedback..."
                />
                <AnimatePresence>
                  {errors.feedbackText && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.feedbackText}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {errors.submit && (
                  <motion.div 
                    className="bg-red-50 border border-red-200 rounded-2xl p-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <p className="text-red-600 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.submit}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <motion.div 
                className="flex gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all duration-300"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-6 py-4 font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 ${
                    isOutsideClass
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {isSubmitting ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      {editingFeedback ? <Edit3 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                      {editingFeedback ? 'Update Feedback' : 'Add Feedback'}
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              className="absolute inset-0 bg-black/40 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Feedback</h3>
                  <p className="text-gray-600 mb-6">Are you sure you want to delete this feedback? This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}