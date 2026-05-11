import { formatDistanceToNow, format } from 'date-fns'

const toDate = (value: string | number | null | undefined): Date | null => {
  if (!value) return null
  try {
    const d = new Date(isNaN(Number(value)) ? value : Number(value))
    if (isNaN(d.getTime())) return null
    return d
  } catch {
    return null
  }
}

export const safeTimeAgo = (value: string | number | null | undefined): string => {
  const d = toDate(value)
  if (!d) return ''
  try {
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return ''
  }
}

export const safeFormat = (value: string | number | null | undefined, fmt: string): string => {
  const d = toDate(value)
  if (!d) return ''
  try {
    return format(d, fmt)
  } catch {
    return ''
  }
}

export const safeIsPast = (value: string | number | null | undefined): boolean => {
  const d = toDate(value)
  if (!d) return false
  return d.getTime() < Date.now()
}