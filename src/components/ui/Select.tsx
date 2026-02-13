import React from 'react'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  fullWidth?: boolean
  placeholder?: string
}

/**
 * Componente Select reutilizável
 */
export default function Select({
  label,
  error,
  helperText,
  options,
  fullWidth = false,
  placeholder,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error

  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`${styles.select} ${hasError ? styles.error : ''} ${className}`}
        aria-invalid={hasError}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${selectId}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${selectId}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
}
