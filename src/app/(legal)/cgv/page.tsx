import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Generales de Vente - EvalUp',
  description: 'CGV du service EvalUp',
}

export default function CGVPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Conditions Generales de Vente
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Derniere mise a jour : Fevrier 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Objet
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les presentes Conditions Generales de Vente (CGV) regissent les ventes de services
            de valorisation d'entreprise proposees par la societe POSSE, editrice du service EvalUp.
            Elles s'appliquent a tout achat unitaire ou souscription d'abonnement effectue sur le
            site evalup.fr.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Description du service
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
            EvalUp est un outil d'aide a la valorisation d'entreprise utilisant l'intelligence
            artificielle. Le service fournit des estimations indicatives basees sur les donnees
            financieres publiques et les informations communiquees par l'utilisateur.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium mb-2">
              Avertissement important
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
              Les valorisations fournies par EvalUp sont des estimations indicatives generees par
              intelligence artificielle. Elles ne constituent en aucun cas une expertise certifiee,
              un audit financier, un conseil en investissement ou une evaluation opposable. EvalUp
              ne se substitue pas a l'intervention d'un expert-comptable, d'un commissaire aux
              comptes ou d'un evaluateur professionnel agree. Pour toute decision financiere
              importante (cession, acquisition, levee de fonds), nous recommandons de faire appel
              a un professionnel qualifie.
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
            <li><strong className="text-[var(--text-primary)]">Evaluation Flash :</strong> Gratuite - Estimation indicative avec fourchette large</li>
            <li><strong className="text-[var(--text-primary)]">Evaluation Complete :</strong> 79 EUR TTC par evaluation - Rapport PDF professionnel de 32 pages, 5 methodes de valorisation, analyse financiere detaillee</li>
            <li><strong className="text-[var(--text-primary)]">Pro 10 :</strong> 199 EUR TTC/mois - 10 evaluations completes par mois</li>
            <li><strong className="text-[var(--text-primary)]">Pro Illimite :</strong> 399 EUR TTC/mois - Evaluations illimitees</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            Les prix sont indiques toutes taxes comprises (TTC). POSSE se reserve le droit de
            modifier ses tarifs a tout moment. Les modifications de prix ne s'appliquent pas aux
            achats unitaires deja effectues ni aux abonnements en cours de periode.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Modalites de paiement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le paiement s'effectue par carte bancaire via notre prestataire de paiement
            securise Stripe. Les cartes acceptees sont : Visa, Mastercard, American Express.
            POSSE ne stocke aucune donnee bancaire. Le traitement des paiements est entierement
            delegue a Stripe, certifie PCI DSS.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Fiabilite des donnees et limitations
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            Les valorisations sont calculees a partir de :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 list-disc list-inside mb-3">
            <li>Donnees financieres publiques (source : Pappers / INPI)</li>
            <li>Informations declaratives fournies par l'utilisateur</li>
            <li>Modeles algorithmiques et intelligence artificielle (Claude, Anthropic)</li>
            <li>Multiples sectoriels de reference</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            POSSE ne garantit ni l'exactitude, ni l'exhaustivite, ni l'adequation des resultats
            a une situation particuliere. L'utilisateur est seul responsable de la verification
            et de l'utilisation des resultats fournis. Les donnees financieres publiques peuvent
            contenir des erreurs ou etre incompletes.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            6. Limitation de responsabilite
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            POSSE ne saurait etre tenue responsable :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 list-disc list-inside mb-3">
            <li>Des decisions prises sur la base des valorisations fournies</li>
            <li>Des pertes financieres directes ou indirectes resultant de l'utilisation du service</li>
            <li>Des ecarts entre les estimations fournies et la valeur reelle de transaction</li>
            <li>Des interruptions temporaires du service</li>
            <li>Des erreurs dans les donnees publiques utilisees</li>
          </ul>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            En tout etat de cause, la responsabilite de POSSE est limitee au montant paye par
            l'utilisateur pour le service concerne.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            7. Droit de retractation et remboursement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            Conformement a l'article L221-28 du Code de la consommation, le droit de
            retractation ne peut etre exerce pour les contenus numeriques non fournis sur un
            support materiel dont l'execution a commence avec l'accord du consommateur.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Toutefois, en cas de dysfonctionnement technique avere empechant la delivrance du
            service, un remboursement pourra etre accorde sur demande adressee a contact@evalup.fr
            dans un delai de 14 jours suivant l'achat.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            8. Resiliation des abonnements
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Vous pouvez resilier votre abonnement a tout moment depuis votre espace personnel.
            La resiliation prendra effet a la fin de la periode de facturation en cours. Aucun
            remboursement au prorata n'est effectue pour la periode restante. L'acces aux
            evaluations deja realisees est conserve apres resiliation.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            9. Propriete intellectuelle
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les rapports PDF generes par EvalUp sont la propriete de l'utilisateur qui les a
            commandes. En revanche, les algorithmes, modeles, methodes de calcul, code source et
            l'ensemble des elements constitutifs du service restent la propriete exclusive de POSSE.
            Toute reproduction ou reutilisation non autorisee est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            10. Droit applicable et litiges
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            Les presentes CGV sont soumises au droit francais. En cas de litige, une solution
            amiable sera recherchee en priorite. A defaut, tout litige sera de la competence
            exclusive des tribunaux du ressort de la Cour d'appel de Versailles.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Conformement aux dispositions du Code de la consommation, le consommateur peut
            recourir gratuitement au service de mediation de la consommation. Le mediateur
            peut etre saisi par voie electronique a contact@evalup.fr.
          </p>
        </section>
      </div>
    </article>
  )
}
