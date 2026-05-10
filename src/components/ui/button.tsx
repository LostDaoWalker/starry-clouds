import * as React from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'panel'
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  const variants = {
    default: 'bg-emerald text-ink shadow-jade',
    ghost: 'bg-deep text-mint shadow-none hover:bg-jade-soft',
    panel: 'bg-jade-soft text-mint shadow-none hover:bg-jade-line',
  }

  return (
    <button
      className={cn('rounded-md px-4 py-3 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)}
      {...props}
    />
  )
}
