import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary-500 text-white shadow-sm hover:bg-primary-600 hover:shadow-md',
        accent:
          'bg-accent-500 text-[#1a1a1a] font-semibold shadow-sm hover:bg-accent-600 hover:text-white hover:shadow-md',
        secondary:
          'bg-white text-steel-700 border border-steel-300 shadow-sm hover:bg-steel-50',
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md',
        outline:
          'border border-steel-300 bg-white text-steel-700 hover:bg-steel-50',
        ghost: 'text-steel-700 hover:bg-steel-100 hover:text-steel-900',
        link: 'text-primary-600 underline-offset-4 hover:underline hover:translate-y-0',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-amber-100 text-amber-800',
        destructive: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        neutral: 'bg-dust-200 text-steel-700',
        accent: 'bg-accent-100 text-accent-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
