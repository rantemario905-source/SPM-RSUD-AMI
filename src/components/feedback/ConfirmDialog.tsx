import { useEffect, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmIcon?: ReactNode
  onConfirm: () => void
  onClose: () => void
}

function ConfirmDialog({ open, title, message, confirmLabel = 'Hapus', cancelLabel = 'Batal', confirmIcon, onConfirm, onClose }: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <span className="confirm-dialog-icon"><CircleAlert size={20} /></span>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button className="secondary-button" type="button" autoFocus onClick={onClose}>{cancelLabel}</button>
          <button className="primary-button confirm-dialog-confirm" type="button" onClick={onConfirm}>{confirmIcon}{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
