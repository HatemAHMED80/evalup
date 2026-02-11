import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité - EvalUp',
  description: 'Politique de confidentialité et RGPD du service EvalUp',
}

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Politique de confidentialité
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Dernière mise à jour : Janvier 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Responsable du traitement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le responsable du traitement des données personnelles est :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">POSSE</strong></li>
            <li>22 RUE DU PRÉSIDENT WILSON, 78230 LE PECQ</li>
            <li>Email : contact@evalup.fr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Données collectées
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Nous collectons les données suivantes :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Données d'identification :</strong> nom, prénom, email</li>
            <li><strong className="text-[var(--text-primary)]">Données de connexion :</strong> identifiants, logs de connexion</li>
            <li><strong className="text-[var(--text-primary)]">Données d'utilisation :</strong> évaluations réalisées, historique</li>
            <li><strong className="text-[var(--text-primary)]">Données de paiement :</strong> traitées par Stripe (nous ne stockons pas vos données bancaires)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Finalités du traitement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Vos données sont traitées pour les finalités suivantes :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li>Fourniture et gestion du service EvalUp</li>
            <li>Gestion des comptes utilisateurs</li>
            <li>Gestion des abonnements et facturation</li>
            <li>Amélioration du service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Vos droits
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Droit d'accès :</strong> obtenir une copie de vos données</li>
            <li><strong className="text-[var(--text-primary)]">Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong className="text-[var(--text-primary)]">Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong className="text-[var(--text-primary)]">Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            Pour exercer ces droits, contactez-nous à :{' '}
            <a href="mailto:contact@evalup.fr" className="text-[var(--accent)] hover:underline">
              contact@evalup.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Sécurité
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
            pour protéger vos données : chiffrement HTTPS, accès restreints, sauvegardes
            régulières.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            6. Contact
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Pour toute question relative à cette politique :{' '}
            <a href="mailto:contact@evalup.fr" className="text-[var(--accent)] hover:underline">
              contact@evalup.fr
            </a>
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire
            une réclamation auprès de la CNIL (cnil.fr).
          </p>
        </section>
      </div>
    </article>
  )
}
