import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales - EvalUp',
  description: 'Mentions légales du service EvalUp',
}

export default function MentionsLegalesPage() {
  return (
    <article>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">
        Mentions légales
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        Dernière mise à jour : Janvier 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            1. Éditeur du site
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le site EvalUp est édité par :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Raison sociale :</strong> POSSE</li>
            <li><strong className="text-[var(--text-primary)]">Forme juridique :</strong> Société par Actions Simplifiée (SAS)</li>
            <li><strong className="text-[var(--text-primary)]">SIRET :</strong> 895 291 052 00010</li>
            <li><strong className="text-[var(--text-primary)]">Siège social :</strong> 22 RUE DU PRESIDENT WILSON, 78230 LE PECQ</li>
            <li><strong className="text-[var(--text-primary)]">Représentant légal :</strong> Hatem AHMED, Président</li>
            <li><strong className="text-[var(--text-primary)]">Email :</strong> contact@evalup.fr</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            2. Hébergement
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Le site est hébergé par :
          </p>
          <ul className="text-[var(--text-secondary)] space-y-2 mt-4 list-disc list-inside">
            <li><strong className="text-[var(--text-primary)]">Nom :</strong> Vercel Inc.</li>
            <li><strong className="text-[var(--text-primary)]">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            3. Propriété intellectuelle
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            L&apos;ensemble du contenu du site EvalUp (textes, images, graphismes, logo, icones, etc.)
            est la propriété exclusive de POSSE. Toute reproduction, même partielle, est strictement
            interdite sans autorisation préalable.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            4. Données personnelles
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression
            de vos données personnelles. Pour exercer ces droits, contactez-nous à : contact@evalup.fr
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed mt-2">
            Pour plus d&apos;informations, consultez notre{' '}
            <Link href="/privacy" className="text-[var(--accent)] hover:underline">
              politique de confidentialité
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">
            5. Contact
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Pour toute question concernant ces mentions légales, vous pouvez nous contacter à :{' '}
            <a href="mailto:contact@evalup.fr" className="text-[var(--accent)] hover:underline">
              contact@evalup.fr
            </a>
          </p>
        </section>
      </div>
    </article>
  )
}
