// Module [DATA_UPDATE] — capture structurée des retraitements et données qualitatives
// Le bloc est parsé côté client (ChatInterface.tsx) et mergé dans ConversationContext
// Il est invisible pour l'utilisateur (strippé dans MessageBubble.tsx)

export const DATA_UPDATE_PROMPT = `
## CAPTURE DE DONNÉES STRUCTURÉES

Quand l'utilisateur te donne une information chiffrée sur un retraitement EBITDA ou une donnée qualitative, tu DOIS ajouter un bloc [DATA_UPDATE] à la FIN de ton message, APRÈS tout le texte visible et APRÈS [SUGGESTIONS] si présent.

### Format

[DATA_UPDATE]{"retraitements":{...},"qualitative":{...}}[/DATA_UPDATE]

### Règles

1. JSON valide obligatoire (pas de commentaires, pas de trailing comma)
2. N'inclus QUE les champs collectés dans cette réponse (mise à jour incrémentale)
3. Le bloc est INVISIBLE pour l'utilisateur — place-le en DERNIÈRE ligne
4. UN SEUL bloc par message
5. Ne PAS émettre si la réponse est vague, "je ne sais pas", ou si tu poses une question de suivi

### Champs retraitements (valeurs en euros annuels)

- salaireDirigeant : salaire brut chargé annuel du dirigeant
- loyerAnnuel : loyer payé par l'entreprise au dirigeant/SCI
- loyerMarche : valeur locative marché des locaux
- loyerAppartientDirigeant : true si locaux appartiennent au dirigeant ou sa SCI
- creditBailAnnuel : loyers de crédit-bail annuels
- creditBailRestant : capital restant dû sur les contrats de crédit-bail
- chargesExceptionnelles : charges non récurrentes à neutraliser
- produitsExceptionnels : produits non récurrents à neutraliser
- salairesExcessifsFamille : partie excessive des salaires famille
- salairesInsuffisantsFamille : manque de rémunération famille

### Champs qualitative

- dependanceDirigeant : "faible" | "moyenne" | "forte"
- concentrationClients : % du CA réalisé avec le premier client
- litiges : true/false (procédures juridiques en cours)
- contratsCles : true/false (contrats long terme sécurisés)

### Exemples

Utilisateur : "Je me verse 120 000€ brut chargé par an"
→ Ton message normal, puis :
[DATA_UPDATE]{"retraitements":{"salaireDirigeant":120000}}[/DATA_UPDATE]

Utilisateur : "Les locaux m'appartiennent via une SCI, loyer 2000€/mois, le marché serait plutôt 2500€/mois"
→ [DATA_UPDATE]{"retraitements":{"loyerAppartientDirigeant":true,"loyerAnnuel":24000,"loyerMarche":30000}}[/DATA_UPDATE]

Utilisateur : "Oui j'ai un crédit-bail sur un véhicule, 800€/mois, reste 15000€ à payer"
→ [DATA_UPDATE]{"retraitements":{"creditBailAnnuel":9600,"creditBailRestant":15000}}[/DATA_UPDATE]

Utilisateur : "On a eu un litige qui nous a coûté 45000€ l'an dernier, c'est réglé"
→ [DATA_UPDATE]{"retraitements":{"chargesExceptionnelles":45000},"qualitative":{"litiges":false}}[/DATA_UPDATE]

Utilisateur : "Mon plus gros client fait 40% du CA, on a des contrats de 3 ans"
→ [DATA_UPDATE]{"qualitative":{"concentrationClients":40,"contratsCles":true}}[/DATA_UPDATE]

Utilisateur : "La transition prendrait environ 6 mois, je suis assez impliqué"
→ [DATA_UPDATE]{"qualitative":{"dependanceDirigeant":"moyenne"}}[/DATA_UPDATE]

Utilisateur : "Non, pas de crédit-bail" ou "Je ne sais pas"
→ Pas de [DATA_UPDATE]
`
