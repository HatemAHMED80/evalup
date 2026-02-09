import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Generales d\'Utilisation - EvalUp',
  description: 'CGU du service EvalUp',
}

export default function CGUPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Conditions Generales d'Utilisation
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
            Les presentes Conditions Generales d'Utilisation (CGU) ont pour objet de definir
            les conditions d'acces et d'utilisation du service EvalUp, plateforme
            d'evaluation d'entreprises par intelligence artificielle.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Acceptation des CGU
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            L'utilisation du service EvalUp implique l'acceptation pleine et entiere
            des presentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas
            utiliser le service.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Description du service
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            EvalUp est un service en ligne permettant d'obtenir une estimation de la valeur
            d'une entreprise a partir de donnees financieres et d'informations publiques.
            Le service utilise l'intelligence artificielle pour analyser ces donnees.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
            <strong className="text-[var(--text-primary)]">Important :</strong> Les evaluations fournies par EvalUp
            sont des estimations a titre indicatif uniquement. Elles ne constituent en aucun cas
            un conseil financier, juridique ou d'investissement.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Inscription et compte
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Pour acceder a certaines fonctionnalites du service, vous devez creer un compte
            en fournissant des informations exactes et a jour. Vous etes responsable de la
            confidentialite de vos identifiants de connexion.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Utilisation du service
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Vous vous engagez a utiliser le service de maniere licite et conforme aux presentes CGU.
            Il est notamment interdit de :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li>Utiliser le service a des fins illegales ou non autorisees</li>
            <li>Tenter d'acceder a des donnees non destinees a l'utilisateur</li>
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
            etre tenue responsable des decisions prises sur la base des informations fournies
            par le service.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            7. Droit applicable
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Les presentes CGU sont regies par le droit francais. Tout litige relatif a leur
            interpretation ou execution releve de la competence exclusive des tribunaux francais.
          </p>
        </section>
      </div>
    </article>
  )
}
