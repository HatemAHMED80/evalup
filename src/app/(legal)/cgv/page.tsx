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
        Derniere mise a jour : Janvier 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Objet
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les presentes Conditions Generales de Vente (CGV) regissent les ventes d'abonnements
            au service EvalUp proposees par POSSE. Elles s'appliquent a toute souscription
            d'abonnement effectuee sur le site evalup.fr.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Prix et offres
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            EvalUp propose les offres suivantes :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Gratuit :</strong> 0 EUR - Evaluation Flash</li>
            <li><strong className="text-[var(--text-primary)]">Evaluation Complete :</strong> 79 EUR TTC - Par evaluation</li>
            <li><strong className="text-[var(--text-primary)]">Pro 10 :</strong> 199 EUR TTC/mois - 10 evaluations/mois</li>
            <li><strong className="text-[var(--text-primary)]">Pro Illimite :</strong> 399 EUR TTC/mois - Evaluations illimitees</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Modalites de paiement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le paiement s'effectue par carte bancaire via notre prestataire de paiement
            securise Stripe. Les cartes acceptees sont : Visa, Mastercard, American Express.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Droit de retractation
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Conformement a l'article L221-28 du Code de la consommation, le droit de
            retractation ne peut etre exerce pour les contenus numeriques non fournis sur un
            support materiel dont l'execution a commence avec l'accord du consommateur.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Resiliation
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Vous pouvez resilier votre abonnement a tout moment depuis votre espace personnel.
            La resiliation prendra effet a la fin de la periode de facturation en cours.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            6. Droit applicable
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les presentes CGV sont soumises au droit francais. Tout litige sera de la competence
            exclusive des tribunaux du ressort de la Cour d'appel de Versailles.
          </p>
        </section>
      </div>
    </article>
  )
}
