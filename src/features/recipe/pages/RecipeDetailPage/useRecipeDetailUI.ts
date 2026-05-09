import { useState } from 'react'

export const useRecipeDetailUI = () => {
  const [cookMode, setCookMode] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  return {
    cookMode,
    setCookMode,
    calendarOpen,
    setCalendarOpen,
    showActions,
    setShowActions,
    confirmDelete,
    setConfirmDelete,
    deleting,
    setDeleting,
  }
}
