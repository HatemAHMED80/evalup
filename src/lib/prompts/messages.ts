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

// --- Onboarding guidé ---

export const MESSAGE_ONBOARDING_WELCOME = (params: {
  nom: string
  dataYear?: number | null
  nextYear: number
}) => {
  const { nom, dataYear, nextYear } = params
  return `Bienvenue dans votre évaluation.

Les données${dataYear ? ` **${dataYear}**` : ''} de **${nom}** sont pré-remplies dans le panneau de droite.

Vérifiez chaque chiffre, corrigez si besoin, et ajoutez vos données **${nextYear}** si vous les avez.`
}

export const MESSAGE_ONBOARDING_VALIDATE = () => {
  return `Une fois les chiffres vérifiés, assurez-vous d'atteindre au moins **40%** de complétion (visible en haut du panneau), puis cliquez sur **Valider mes données** ci-dessous.

[VALIDATE_DATA]`
}
