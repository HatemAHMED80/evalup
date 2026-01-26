// Redirection vers la page principale avec le SIREN en parametre
// Cette page est conservee pour la retrocompatibilite des URLs et bookmarks

import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ siren: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { siren } = await params

  // Rediriger vers la page principale avec le SIREN
  redirect(`/?siren=${siren}`)
}
