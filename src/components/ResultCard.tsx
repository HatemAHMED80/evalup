// Carte affichant un résultat d'évaluation

interface ResultCardProps {
  titre: string
  valeur: string
  description?: string
  variante?: 'default' | 'highlight' | 'secondary'
}

export default function ResultCard({
  titre,
  valeur,
  description,
  variante = 'default',
}: ResultCardProps) {
  // Styles selon la variante
  const baseStyle = 'rounded-xl p-6 transition-all duration-300'

  const varianteStyles = {
    default: 'bg-white border border-gray-200 hover:shadow-lg',
    highlight: 'bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] text-white shadow-xl',
    secondary: 'bg-gray-50 border border-gray-100',
  }

  const titreStyles = {
    default: 'text-gray-600',
    highlight: 'text-gray-200',
    secondary: 'text-gray-500',
  }

  const valeurStyles = {
    default: 'text-[#1e3a5f]',
    highlight: 'text-white',
    secondary: 'text-gray-700',
  }

  return (
    <div className={`${baseStyle} ${varianteStyles[variante]}`}>
      <p className={`text-sm font-medium mb-2 ${titreStyles[variante]}`}>
        {titre}
      </p>
      <p className={`text-2xl md:text-3xl font-bold ${valeurStyles[variante]}`}>
        {valeur}
      </p>
      {description && (
        <p className={`text-sm mt-2 ${variante === 'highlight' ? 'text-gray-300' : 'text-gray-500'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
