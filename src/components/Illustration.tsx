interface IllustrationProps {
  variant: 'onboarding' | 'feed' | 'events' | 'marketplace'
  className?: string
}

const VARIANTS = {
  onboarding:  { bg: 'bg-teal-50',   label: 'Welcome home',         color: 'text-teal-400' },
  feed:        { bg: 'bg-purple-50', label: 'Start the conversation', color: 'text-purple-400' },
  events:      { bg: 'bg-blue-50',   label: 'Plan something',        color: 'text-blue-400' },
  marketplace: { bg: 'bg-amber-50',  label: 'Share something',       color: 'text-amber-400' },
}

export function Illustration({ variant, className = '' }: IllustrationProps) {
  const v = VARIANTS[variant]
  return (
    <div className={`${v.bg} rounded-xl flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className={`text-[11px] font-medium ${v.color} uppercase tracking-widest`}>
        {v.label}
      </div>
      <div className={`text-[10px] ${v.color} opacity-60`}>illustration coming soon</div>
    </div>
  )
}
