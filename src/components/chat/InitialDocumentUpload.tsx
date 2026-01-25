'use client'

import { useRef, useState } from 'react'

interface InitialDocumentUploadProps {
  onUpload: (files: File[]) => void
  onSkip: () => void
  isUploading?: boolean
  uploadedCount?: number
}

const ACCEPTED_FILES = '.pdf,.xls,.xlsx,.csv,.doc,.docx,.jpg,.jpeg,.png'

const DOCUMENT_SUGGESTIONS = [
  { icon: '📊', label: 'Bilans', desc: 'Bilans des 3 derniers exercices' },
  { icon: '📈', label: 'Comptes de résultat', desc: 'Pour analyser la rentabilité' },
  { icon: '📋', label: 'Liasses fiscales', desc: 'Données fiscales détaillées' },
  { icon: '📦', label: 'Suivi commandes', desc: 'Excel de suivi des ventes' },
  { icon: '👥', label: 'Fichier clients', desc: 'Liste et historique clients' },
  { icon: '📑', label: 'Plaquette commerciale', desc: 'Présentation de l\'entreprise' },
]

export function InitialDocumentUpload({
  onUpload,
  onSkip,
  isUploading = false,
  uploadedCount = 0,
}: InitialDocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return '📄'
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.match(/\.(xls|xlsx|csv)$/i)) return '📊'
    if (file.type.includes('image')) return '🖼️'
    return '📎'
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9a227]/20 to-[#e8c547]/20 mb-3">
          <svg className="w-7 h-7 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          As-tu des documents à partager ?
        </h3>
        <p className="text-sm text-white/60">
          Upload tes documents financiers pour une analyse plus précise et un échange plus rapide
        </p>
      </div>

      {/* Zone de drop */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
          ${dragActive ? 'border-[#c9a227] bg-[#c9a227]/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept={ACCEPTED_FILES}
          multiple
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">
              Glisse tes fichiers ici ou <span className="text-[#c9a227]">parcourir</span>
            </p>
            <p className="text-xs text-white/40 mt-1">
              PDF, Excel, CSV, Images (max 20MB par fichier)
            </p>
          </div>
        </div>
      </div>

      {/* Fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-white/80">
            {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-lg">{getFileIcon(file)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{file.name}</p>
                  <p className="text-xs text-white/40">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="p-1 text-white/40 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions de documents */}
      <div className="mt-5">
        <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Documents utiles</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DOCUMENT_SUGGESTIONS.map((doc, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-xs text-white/60"
            >
              <span>{doc.icon}</span>
              <span>{doc.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onSkip}
          disabled={isUploading}
          className="flex-1 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
        >
          Passer cette étape
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedFiles.length === 0 || isUploading}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-[#1a1a2e] bg-[#c9a227] hover:bg-[#e8c547] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyse en cours...
            </>
          ) : (
            <>
              Analyser {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
