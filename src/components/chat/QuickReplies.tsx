'use client'

interface QuickReply {
  id: string
  label: string
  value?: string
}

interface QuickRepliesProps {
  replies: readonly QuickReply[] | QuickReply[]
  onSelect: (reply: QuickReply) => void
  allowMultiple?: boolean
  selectedIds?: string[]
  className?: string
}

export function QuickReplies({
  replies,
  onSelect,
  allowMultiple: _allowMultiple = false,
  selectedIds = [],
  className = '',
}: QuickRepliesProps) {
  return (
    <div className={`flex flex-wrap gap-2 mt-4 ${className}`}>
      {replies.map((reply) => {
        const isSelected = selectedIds.includes(reply.id)

        return (
          <button
            key={reply.id}
            onClick={() => onSelect(reply)}
            className={`
              px-5 py-2.5
              text-[13.5px] font-medium
              rounded-[var(--radius-full)]
              border
              transition-all duration-150
              ${
                isSelected
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)]'
              }
              active:scale-[0.98]
            `}
          >
            {reply.label}
          </button>
        )
      })}
    </div>
  )
}

// Preset quick replies for common scenarios
export const QUICK_REPLIES = {
  objectives: [
    { id: 'vente', label: 'Vendre mon entreprise', value: 'vente' },
    { id: 'achat', label: 'Acheter une entreprise', value: 'achat' },
    { id: 'associe', label: 'Entrée/sortie d\'associé', value: 'associe' },
    { id: 'financement', label: 'Levée de fonds', value: 'financement' },
    { id: 'succession', label: 'Transmission familiale', value: 'succession' },
  ],
  yesNo: [
    { id: 'yes', label: 'Oui', value: 'oui' },
    { id: 'no', label: 'Non', value: 'non' },
  ],
  timeline: [
    { id: 'immediate', label: 'Immédiat (< 3 mois)', value: 'immediate' },
    { id: 'short', label: 'Court terme (3-6 mois)', value: 'short' },
    { id: 'medium', label: 'Moyen terme (6-12 mois)', value: 'medium' },
    { id: 'long', label: 'Long terme (> 12 mois)', value: 'long' },
  ],
} as const

export default QuickReplies
