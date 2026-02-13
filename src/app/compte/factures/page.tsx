'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  id: string
  amount_paid: number | null
  invoice_url: string | null
  invoice_pdf: string | null
  created_at: string
}

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadInvoices() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('invoices')
        .select('id, amount_paid, invoice_url, invoice_pdf, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setInvoices((data as Invoice[]) || [])
      setIsLoading(false)
    }
    loadInvoices()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatAmount = (cents: number | null) => {
    if (cents == null) return '-'
    return (cents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Mes factures</h1>
          <p className="text-[var(--text-secondary)] mt-1">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Mes factures</h1>
        <p className="text-[var(--text-secondary)] mt-1">Historique de vos paiements</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold">Historique</h2>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide px-6 py-3">
                    Facture
                  </th>
                  <th className="text-left text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide px-6 py-3">
                    Date
                  </th>
                  <th className="text-right text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide px-6 py-3">
                    Montant
                  </th>
                  <th className="text-right text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide px-6 py-3">
                    Statut
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[13px] text-[var(--text-primary)]">
                        {invoice.id.slice(0, 20)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[var(--text-secondary)]">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-[14px] font-medium text-[var(--text-primary)]">
                        {formatAmount(invoice.amount_paid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="success">Payee</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.invoice_pdf ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </a>
                        </Button>
                      ) : invoice.invoice_url ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                            Voir
                          </a>
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">Aucune facture pour le moment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
