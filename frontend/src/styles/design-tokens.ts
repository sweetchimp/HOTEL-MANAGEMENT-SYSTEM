export const colors = {
  // Brand — Yale Blue (headers, primary actions)
  primary: {
    main: '#0f3b59',
    light: '#4d81a4',
    dark: '#0a2a40',
    tint: '#eef3f7',
  },
  // Accent — Goldenrod (highlights, secondary actions)
  accent: {
    main: '#dba12c',
    light: '#e3b440',
    dark: '#c48e1e',
    tint: '#fdf8ec',
  },
  // Supporting — Cool Steel (secondary text, borders)
  steel: {
    main: '#7d929e',
    light: '#a6b8c3',
    dark: '#51616c',
    tint: '#f2f5f7',
  },
  // Supporting — Dust Grey (backgrounds, subtle elements)
  dust: {
    main: '#dbd4cc',
    light: '#e9e5e0',
    dark: '#b1a599',
    tint: '#faf8f6',
  },
  white: '#ffffff',
  dark: '#1a1a1a',
  // Semantic
  success: { main: '#16a34a', tint: '#f0fdf4', text: '#166534' },
  error: { main: '#dc2626', tint: '#fef2f2', text: '#991b1b' },
  warning: { main: '#d97706', tint: '#fffbeb', text: '#92400e' },
  info: { main: '#2563eb', tint: '#eff6ff', text: '#1e40af' },
} as const

export const typography = {
  heading: {
    fontFamily: "'Playfair Display', Georgia, serif",
    sizes: { xl: '1.75rem', lg: '1.5rem', md: '1.25rem', sm: '1.125rem' },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeight: 1.2,
  },
  body: {
    fontFamily: "'Inter', system-ui, sans-serif",
    sizes: { lg: '1rem', md: '0.875rem', sm: '0.8125rem' },
    weights: { regular: 400, medium: 500, semibold: 600 },
    lineHeight: 1.5,
  },
  caption: {
    fontFamily: "'Inter', system-ui, sans-serif",
    sizes: { md: '0.75rem', sm: '0.6875rem' },
    weights: { medium: 500, semibold: 600 },
    lineHeight: 1.4,
  },
} as const

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
} as const

export const radius = {
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  lift: '0 12px 24px -6px rgb(15 59 89 / 0.16)',
} as const

export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  transitions,
} as const

export default designTokens
