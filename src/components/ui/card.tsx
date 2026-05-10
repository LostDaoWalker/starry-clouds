import * as React from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-md border border-jade-line bg-panel p-5 shadow-panel backdrop-blur', className)} {...props} />
}
