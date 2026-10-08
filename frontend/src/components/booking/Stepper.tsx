import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  steps: string[]
  current: number
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={step} className={cn('flex items-start', i < steps.length - 1 && 'flex-1')}>
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                  done && 'border-primary-500 bg-primary-500 text-white',
                  active && 'border-accent-500 bg-accent-500 text-primary-900 shadow-md',
                  !done && !active && 'border-dust-300 bg-white text-steel-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px] font-medium',
                  active && 'text-primary-700',
                  done && 'text-primary-500',
                  !done && !active && 'text-steel-400',
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-1 mt-4 h-0.5 flex-1 rounded-full sm:mx-2', done ? 'bg-primary-500' : 'bg-dust-300')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
