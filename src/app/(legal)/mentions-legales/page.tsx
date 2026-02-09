import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions legales - EvalUp',
  description: 'Mentions legales du service EvalUp',
}

export default function MentionsLegalesPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Mentions legales
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Derniere mise a jour : Janvier 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Editeur du site
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le site EvalUp est edite par :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Raison sociale :</strong> POSSE</li>
            <li><strong className="text-[var(--text-primary)]">Forme juridique :</strong> Societe par Actions Simplifiee (SAS)</li>
            <li><strong className="text-[var(--text-primary)]">SIRET :</strong> 895 291 052 00010</li>
            <li><strong className="text-[var(--text-primary)]">Siege social :</strong> 22 RUE DU PRESIDENT WILSON, 78230 LE PECQ</li>
            <li><strong className="text-[var(--text-primary)]">Representant legal :</strong> Hatem AHMED, President</li>
            <li><strong className="text-[var(--text-primary)]">Email :</strong> contact@evalup.fr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Hebergement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le site est heberge par :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Nom :</strong> Vercel Inc.</li>
            <li><strong className="text-[var(--text-primary)]">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Propriete intellectuelle
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            L'ensemble du contenu du site EvalUp (textes, images, graphismes, logo, icones, etc.)
            est la propriete exclusive de POSSE. Toute reproduction, meme partielle, est strictement
            interdite sans autorisation prealable.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Donnees personnelles
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Conformement au RGPD, vous disposez d'un droit d'acces, de rectification et de suppression
            de vos donnees personnelles. Pour exercer ces droits, contactez-nous a : contact@evalup.fr
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-2">
            Pour plus d'informations, consultez notre{' '}
            <Link href="/privacy" className="text-[var(--accent)] hover:underline">
              politique de confidentialite
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Contact
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Pour toute question concernant ces mentions legales, vous pouvez nous contacter a :{' '}
            <a href="mailto:contact@evalup.fr" className="text-[var(--accent)] hover:underline">
              contact@evalup.fr
            </a>
          </p>
        </section>
      </div>
    </article>
  )
}
