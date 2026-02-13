import React from 'react'
import styles from './Textarea.module.css'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

/**
 * Componente Textarea reutilizável
 */
export default function Textarea({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error

  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`${styles.textarea} ${hasError ? styles.error : ''} ${className}`}
        aria-invalid={hasError}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />
      {error && (
        <span id={`${textareaId}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${textareaId}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
}
