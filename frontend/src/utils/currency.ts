const USD_TO_UGX = 3700

export const formatCurrency = (amount: number, currency: string = 'UGX'): string => {
  if (currency === 'UGX') {
    const usdToUgx = amount * USD_TO_UGX
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(usdToUgx)
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const formatCurrencyCompact = (amount: number, currency: string = 'UGX'): string => {
  const value = currency === 'UGX' ? amount * USD_TO_UGX : amount
  const prefix = currency === 'UGX' ? 'USh ' : '$'

  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}k`
  return `${prefix}${Math.round(value)}`
}
