import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'positive' | 'negative'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    const variants = {
      success: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]',
      warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
      danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]',
      info: 'bg-[rgba(31,45,230,0.1)] text-[var(--accent)] border-[rgba(31,45,230,0.2)]',
      neutral: 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]',
      positive: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]',
      negative: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5',
          'h-6 rounded-full px-3',
          'text-xs font-medium',
          'letter-spacing-normal',
          'border',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }