'use client'

import { useState } from 'react'
import { SimpleHeader } from '../../../components/layout/Header'
import { Card, CardHeader, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useTheme } from '../../../contexts/ThemeContext'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    evaluationComplete: true,
    weeklyReport: false,
  })

  return (
    <div className="flex flex-col h-full">
      <SimpleHeader title="Parametres" subtitle="Configurez votre experience EvalUp" />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader title="Notifications" description="Gerez vos preferences de notification" />
            <CardContent>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      Notifications par email
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      Recevoir des emails pour les mises a jour importantes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                    className="w-5 h-5 accent-[var(--accent)]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      Évaluation terminée
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      Etre notifie quand une evaluation est terminee
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.evaluationComplete}
                    onChange={(e) => setNotifications({ ...notifications, evaluationComplete: e.target.checked })}
                    className="w-5 h-5 accent-[var(--accent)]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      Rapport hebdomadaire
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      Recevoir un résumé de vos évaluations chaque semaine
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.weeklyReport}
                    onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                    className="w-5 h-5 accent-[var(--accent)]"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card>
            <CardHeader title="Apparence" description="Personnalisez l'affichage" />
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-[14px] font-medium text-[var(--text-primary)] mb-3">
                    Theme
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`
                        flex-1 p-4 rounded-[var(--radius-md)] border-2 transition-all
                        ${theme === 'light'
                          ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-white border border-gray-200 flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                          </svg>
                        </div>
                        <span className={`text-[13px] font-medium ${theme === 'light' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                          Clair
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`
                        flex-1 p-4 rounded-[var(--radius-md)] border-2 transition-all
                        ${theme === 'dark'
                          ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className={`text-[13px] font-medium ${theme === 'dark' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                          Sombre
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Langue */}
          <Card>
            <CardHeader title="Langue" description="Choisissez votre langue preferee" />
            <CardContent>
              <select className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-primary)] text-[14px] text-[var(--text-primary)]">
                <option value="fr">Francais</option>
                <option value="en" disabled>English (bientot)</option>
              </select>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card variant="outlined" className="border-[var(--danger)]/30">
            <CardHeader title="Zone de danger" description="Actions irreversibles" />
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      Supprimer toutes les évaluations
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      Cette action est irreversible
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/10">
                    Supprimer
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      Supprimer mon compte
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      Toutes vos données seront supprimées
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/10">
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
