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
  const lastCompleteYear = currentYear - 1
  return `Parfait ! Tu viens de voir le rapport des données publiques de **${entreprise.nom}**.

${entreprise.dataYear ? `Ces informations datent de **${entreprise.dataYear}**. ` : ''}Pour réaliser une évaluation précise, j'aurais besoin des **données ${lastCompleteYear}** (ou ${currentYear} si disponibles).

📍 **Étape 1/6** : Préparation de l'évaluation

**As-tu des documents à partager qui pourraient accélérer l'évaluation ?**

Par exemple :
- 📊 Bilans et comptes de résultat récents
- 📈 Liasse fiscale
- 💼 Suivi de trésorerie ou tableau de bord
- 📋 Fichier clients ou commandes

_En fonction des documents que tu partages, je pourrai adapter mes questions et me concentrer uniquement sur les informations manquantes._

Tu peux **uploader tes fichiers** ci-dessous, ou si tu préfères, **répondre directement** et je te guiderai étape par étape.
`
}

// Message initial quand l'utilisateur n'a pas de documents
export const MESSAGE_INITIAL_SANS_DOCUMENTS = (entreprise: {
  nom: string
  secteur: string
  dateCreation: string
  effectif: string
  ville: string
  ca?: string
  dataYear?: number | null
}) => {
  const currentYear = new Date().getFullYear()
  const lastCompleteYear = currentYear - 1
  return `Pas de souci ! On va procéder ensemble étape par étape 📝

Je vais te poser quelques questions pour obtenir tes **données ${lastCompleteYear}/${currentYear}** et compléter les informations publiques de **${entreprise.nom}**${entreprise.dataYear ? ` (qui datent de ${entreprise.dataYear})` : ''}.

📍 **Étape 1/6** : Découverte de l'entreprise

Commençons par mieux comprendre ton activité.

**Peux-tu me décrire en quelques mots ce que fait ${entreprise.nom} ?**

_Par exemple : "On vend des équipements de sport en ligne" ou "On fait de la prestation de conseil en informatique"_
`
}
