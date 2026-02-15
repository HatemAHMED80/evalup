// Messages initiaux pour le chat d'evaluation

export const MESSAGE_INITIAL = (entreprise: {
  nom: string
  secteur: string
  dateCreation: string
  effectif: string
  ville: string
  ca?: string
  dataYear?: number | null
}) => {
  const currentYear = new Date().getFullYear()
  const nextYear = entreprise.dataYear ? entreprise.dataYear + 1 : currentYear
  return `Les données${entreprise.dataYear ? ` **${entreprise.dataYear}**` : ''} de **${entreprise.nom}** sont pré-remplies dans le panneau à droite. Vérifiez-les et ajoutez vos chiffres **${nextYear}** si vous les avez.

Je suis là pour vous guider.`
}
