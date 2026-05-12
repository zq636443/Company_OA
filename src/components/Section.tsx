import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, action, children, className }: SectionProps) {
  return (
    <section className={`section ${className ?? ''}`.trim()}>
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
