import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente - EvalUp',
  description: 'CGV du service EvalUp',
}

export default function CGVPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Conditions Générales de Vente
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Dernière mise à jour : Février 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Objet
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les presentes Conditions Générales de Vente (CGV) regissent les ventes de services
            de valorisation d&apos;entreprise proposées par la société POSSE, éditrice du service EvalUp.
            Elles s&apos;appliquent à tout achat unitaire ou souscription d&apos;abonnement effectué sur le
            site evalup.fr.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Description du service
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            EvalUp est un outil d&apos;aide à la valorisation d&apos;entreprise utilisant l&apos;intelligence
            artificielle. Le service fournit des estimations indicatives basées sur les données
            financières publiques et les informations communiquées par l&apos;utilisateur.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium mb-2">
              Avertissement important
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
              Les valorisations fournies par EvalUp sont des estimations indicatives générées par
              intelligence artificielle. Elles ne constituent en aucun cas une expertise certifiée,
              un audit financier, un conseil en investissement ou une évaluation opposable. EvalUp
              ne se substitue pas à l&apos;intervention d&apos;un expert-comptable, d&apos;un commissaire aux
              comptes ou d&apos;un évaluateur professionnel agréé. Pour toute décision financière
              importante (cession, acquisition, levée de fonds), nous recommandons de faire appel
              à un professionnel qualifié.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Prix et offres
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            EvalUp propose les offres suivantes :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Évaluation Flash :</strong> Gratuite - Estimation indicative avec fourchette large</li>
            <li><strong className="text-[var(--text-primary)]">Évaluation Complète :</strong> 79 EUR TTC par évaluation - Rapport PDF professionnel de 32 pages, 5 méthodes de valorisation, analyse financière détaillée</li>
            <li><strong className="text-[var(--text-primary)]">Pro 10 :</strong> 199 EUR TTC/mois - 10 évaluations complètes par mois</li>
            <li><strong className="text-[var(--text-primary)]">Pro Illimité :</strong> 399 EUR TTC/mois - Évaluations illimitées</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            Les prix sont indiques toutes taxes comprises (TTC). POSSE se reserve le droit de
            modifier ses tarifs à tout moment. Les modifications de prix ne s&apos;appliquent pas aux
            achats unitaires déjà effectués ni aux abonnements en cours de periode.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Modalites de paiement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le paiement s&apos;effectue par carte bancaire via notre prestataire de paiement
            sécurisé Stripe. Les cartes acceptées sont : Visa, Mastercard, American Express.
            POSSE ne stocke aucune donnée bancaire. Le traitement des paiements est entièrement
            délégué à Stripe, certifié PCI DSS.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Fiabilité des données et limitations
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            Les valorisations sont calculées à partir de :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 list-disc list-inside mb-3">
            <li>Données financières publiques (source : Pappers / INPI)</li>
            <li>Informations déclaratives fournies par l&apos;utilisateur</li>
            <li>Modèles algorithmiques et intelligence artificielle (Claude, Anthropic)</li>
            <li>Multiples sectoriels de référence</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            POSSE ne garantit ni l&apos;exactitude, ni l&apos;exhaustivite, ni l&apos;adéquation des résultats
            à une situation particulière. L&apos;utilisateur est seul responsable de la vérification
            et de l&apos;utilisation des résultats fournis. Les données financières publiques peuvent
            contenir des erreurs ou être incomplètes.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            6. Limitation de responsabilite
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            POSSE ne saurait être tenue responsable :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 list-disc list-inside mb-3">
            <li>Des décisions prises sur la base des valorisations fournies</li>
            <li>Des pertes financieres directes ou indirectes résultant de l&apos;utilisation du service</li>
            <li>Des écarts entre les estimations fournies et la valeur réelle de transaction</li>
            <li>Des interruptions temporaires du service</li>
            <li>Des erreurs dans les données publiques utilisees</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            En tout état de cause, la responsabilité de POSSE est limitée au montant payé par
            l&apos;utilisateur pour le service concerné.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            7. Droit de rétractation et remboursement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de
            rétractation ne peut être exercé pour les contenus numériques non fournis sur un
            support matériel dont l&apos;exécution a commencé avec l&apos;accord du consommateur.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Toutefois, en cas de dysfonctionnement technique avéré empêchant la délivrance du
            service, un remboursement pourra etre accordé sur demande adressée a contact@evalup.fr
            dans un délai de 14 jours suivant l&apos;achat.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            8. Résiliation des abonnements
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Vous pouvez résilier votre abonnement à tout moment depuis votre espace personnel.
            La résiliation prendra effet à la fin de la période de facturation en cours. Aucun
            remboursement au prorata n&apos;est effectué pour la période restante. L&apos;acces aux
            évaluations déjà réalisées est conservé après résiliation.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            9. Propriété intellectuelle
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les rapports PDF générés par EvalUp sont la propriété de l&apos;utilisateur qui les a
            commandés. En revanche, les algorithmes, modeles, méthodes de calcul, code source et
            l&apos;ensemble des elements constitutifs du service restent la propriété exclusive de POSSE.
            Toute reproduction ou réutilisation non autorisée est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            10. Droit applicable et litiges
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            Les présentes CGV sont soumises au droit français. En cas de litige, une solution
            amiable sera recherchee en priorite. À défaut, tout litige sera de la compétence
            exclusive des tribunaux du ressort de la Cour d&apos;appel de Versailles.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Conformément aux dispositions du Code de la consommation, le consommateur peut
            recourir gratuitement au service de médiation de la consommation. Le médiateur
            peut etre saisi par voie électronique a contact@evalup.fr.
          </p>
        </section>
      </div>
    </article>
  )
}
