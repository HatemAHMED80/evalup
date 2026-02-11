import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation - EvalUp',
  description: 'CGU du service EvalUp',
}

export default function CGUPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Conditions Générales d'Utilisation
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Dernière mise à jour : Janvier 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Objet
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les presentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir
            les conditions d'acces et d'utilisation du service EvalUp, plateforme
            d'évaluation d'entreprises par intelligence artificielle.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Acceptation des CGU
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            L'utilisation du service EvalUp implique l'acceptation pleine et entière
            des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas
            utiliser le service.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Description du service
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            EvalUp est un service en ligne permettant d'obtenir une estimation de la valeur
            d'une entreprise à partir de données financières et d'informations publiques.
            Le service utilise l'intelligence artificielle pour analyser ces données.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            <strong className="text-[var(--text-primary)]">Important :</strong> Les évaluations fournies par EvalUp
            sont des estimations à titre indicatif uniquement. Elles ne constituent en aucun cas
            un conseil financier, juridique ou d'investissement.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Inscription et compte
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Pour accéder à certaines fonctionnalités du service, vous devez créer un compte
            en fournissant des informations exactes et à jour. Vous êtes responsable de la
            confidentialite de vos identifiants de connexion.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Utilisation du service
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Vous vous engagez a utiliser le service de manière licite et conforme aux présentes CGU.
            Il est notamment interdit de :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li>Utiliser le service à des fins illégales ou non autorisées</li>
            <li>Tenter d'accéder à des données non destinées à l'utilisateur</li>
            <li>Perturber ou surcharger les serveurs du service</li>
            <li>Reproduire ou redistribuer le contenu du service sans autorisation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            6. Limitation de responsabilite
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            EvalUp est fourni "tel quel" sans garantie d'aucune sorte. POSSE ne saurait
            être tenue responsable des décisions prises sur la base des informations fournies
            par le service.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            7. Droit applicable
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les présentes CGU sont régies par le droit français. Tout litige relatif a leur
            interprétation ou exécution relève de la compétence exclusive des tribunaux français.
          </p>
        </section>
      </div>
    </article>
  )
}
