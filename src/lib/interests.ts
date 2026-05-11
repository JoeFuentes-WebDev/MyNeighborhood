const INTEREST_COLORS = [
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#FAECE7', text: '#4A1B0C' },
  { bg: '#EAF3DE', text: '#27500A' },
]

export function interestColor(interest: string): { bg: string; text: string } {
  const hash = interest
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return INTEREST_COLORS[hash % INTEREST_COLORS.length]
}