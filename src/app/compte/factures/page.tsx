'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function FacturesPage() {
  // Mock data
  const invoices = [
    {
      id: 'INV-001',
      date: '15 janvier 2024',
      description: 'Evaluation Complete - DANONE',
      amount: '79,00 €',
      status: 'paid',
    },
    {
      id: 'INV-002',
      date: '3 decembre 2023',
      description: 'Evaluation Complete - ACME SAS',
      amount: '79,00 €',
      status: 'paid',
    },
  ]

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
                  <th className="text-left text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide px-6 py-3">
                    Description
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
                        {invoice.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[var(--text-secondary)]">
                      {invoice.date}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[var(--text-primary)]">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-[14px] font-medium text-[var(--text-primary)]">
                        {invoice.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                        {invoice.status === 'paid' ? 'Payee' : 'En attente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </Button>
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
