import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  id?: string
}

export default function CustomSelect({ options, value, onChange, placeholder, label, id }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.value === value)
  const display = selected?.label ?? placeholder ?? ''

  return (
    <div className="custom-select-wrapper" ref={ref}>
      {label && <label htmlFor={id}>{label}</label>}
      <button
        id={id}
        type="button"
        className="custom-select-trigger"
        onClick={() => setOpen(prev => !prev)}
      >
        <span>{display}</span>
        <span className="custom-select-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="custom-select-dropdown">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`custom-select-option${opt.value === value ? ' selected' : ''}`}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
