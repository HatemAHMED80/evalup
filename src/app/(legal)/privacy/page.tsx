import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialite - EvalUp',
  description: 'Politique de confidentialite et RGPD du service EvalUp',
}

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Politique de confidentialite
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Derniere mise a jour : Janvier 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Responsable du traitement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le responsable du traitement des donnees personnelles est :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">POSSE</strong></li>
            <li>22 RUE DU PRESIDENT WILSON, 78230 LE PECQ</li>
            <li>Email : contact@evalup.fr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Donnees collectees
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Nous collectons les donnees suivantes :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Donnees d'identification :</strong> nom, prenom, email</li>
            <li><strong className="text-[var(--text-primary)]">Donnees de connexion :</strong> identifiants, logs de connexion</li>
            <li><strong className="text-[var(--text-primary)]">Donnees d'utilisation :</strong> evaluations realisees, historique</li>
            <li><strong className="text-[var(--text-primary)]">Donnees de paiement :</strong> traitees par Stripe (nous ne stockons pas vos donnees bancaires)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Finalites du traitement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Vos donnees sont traitees pour les finalites suivantes :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li>Fourniture et gestion du service EvalUp</li>
            <li>Gestion des comptes utilisateurs</li>
            <li>Gestion des abonnements et facturation</li>
            <li>Amelioration du service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Vos droits
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Conformement au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Droit d'acces :</strong> obtenir une copie de vos donnees</li>
            <li><strong className="text-[var(--text-primary)]">Droit de rectification :</strong> corriger vos donnees inexactes</li>
            <li><strong className="text-[var(--text-primary)]">Droit a l'effacement :</strong> demander la suppression de vos donnees</li>
            <li><strong className="text-[var(--text-primary)]">Droit a la portabilite :</strong> recevoir vos donnees dans un format structure</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            Pour exercer ces droits, contactez-nous a :{' '}
            <a href="mailto:contact@evalup.fr" className="text-[var(--accent)] hover:underline">
              contact@evalup.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Securite
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees
            pour proteger vos donnees : chiffrement HTTPS, acces restreints, sauvegardes
            regulieres.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            6. Contact
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Pour toute question relative a cette politique :{' '}
            <a href="mailto:contact@evalup.fr" className="text-[var(--accent)] hover:underline">
              contact@evalup.fr
            </a>
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            Si vous estimez que vos droits ne sont pas respectes, vous pouvez introduire
            une reclamation aupres de la CNIL (cnil.fr).
          </p>
        </section>
      </div>
    </article>
  )
}
