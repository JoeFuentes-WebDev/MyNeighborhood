import { interestColor } from '@/lib/interests'

interface InterestTagProps {
  interest: string
}

export function InterestTag({ interest }: InterestTagProps) {
  const { bg, text } = interestColor(interest)
  return (
    <span
      style={{ background: bg, color: text }}
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
    >
      {interest}
    </span>
  )
}