'use client'

import { useState, useRef, useCallback } from 'react'
import type { ConversationContext, UploadedDocument } from '@/lib/anthropic'

interface UploadFile {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  name: string
}

interface DocumentUploadZoneProps {
  evaluationId?: string
  context: ConversationContext
  onDataExtracted?: (doc: UploadedDocument) => void
  onDocumentAdded?: (doc: UploadedDocument) => void
  compact?: boolean
}

const ACCEPTED = '.pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png'

export function DocumentUploadZone({
  context,
  onDataExtracted,
  onDocumentAdded,
  compact,
}: DocumentUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(
    async (file: File) => {
      setFiles((prev) =>
        prev.map((f) => (f.file === file ? { ...f, status: 'uploading' as const } : f))
      )

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('context', JSON.stringify(context))

        const res = await fetch('/api/documents/analyze', {
          method: 'POST',
          body: formData,
        })
        const analysis = await res.json()

        const doc: UploadedDocument = {
          id: analysis.documentId,
          name: file.name,
          type: file.type,
          size: file.size,
          extractedText: analysis.extractedText,
          analysis: analysis.analysis,
        }

        setFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, status: 'done' as const } : f))
        )
        setCollapsed(true)

        onDocumentAdded?.(doc)
        onDataExtracted?.(doc)
      } catch {
        setFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, status: 'error' as const } : f))
        )
      }
    },
    [context, onDataExtracted, onDocumentAdded]
  )

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return
      const arr = Array.from(incoming)
      const newFiles: UploadFile[] = arr.map((f) => ({
        file: f,
        status: 'pending' as const,
        name: f.name,
      }))
      setFiles((prev) => [...prev, ...newFiles])
      arr.forEach((f) => uploadFile(f))
    },
    [uploadFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  // Collapsed view after successful upload
  const doneCount = files.filter(f => f.status === 'done').length
  const uploadingCount = files.filter(f => f.status === 'uploading').length

  if (collapsed && doneCount > 0) {
    const label = compact
      ? `${doneCount} doc${doneCount > 1 ? 's' : ''}`
      : `${doneCount} document${doneCount > 1 ? 's' : ''} uploade${doneCount > 1 ? 's' : ''}`

    if (compact) {
      return (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(68,170,102,0.06)', fontSize: 10, color: '#448855',
            fontWeight: 500, transition: 'background 0.15s',
          }}
        >
          <span>{'\u2713'}</span>
          {label}
        </button>
      )
    }

    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] transition-colors"
      >
        <svg className="w-3 h-3 text-[var(--success)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {label}
        <svg className="w-3 h-3 ml-auto text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }

  // ─── Compact (dark panel) ───
  if (compact) {
    return (
      <div>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
            border: `1px dashed ${isDragging ? 'rgba(68,102,238,0.15)' : 'rgba(255,255,255,0.04)'}`,
            transition: 'border-color 0.15s',
          }}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED} multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
          <span style={{ fontSize: 13, opacity: 0.4 }}>{'\u2191'}</span>
          <span style={{ fontSize: 11, color: '#555a75' }}>
            {uploadingCount > 0 ? `Upload en cours (${uploadingCount})...` : 'Importer vos documents'}
          </span>
        </div>
      </div>
    )
  }

  // ─── Standard (non-compact) ───
  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-[var(--radius-md)] p-3 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-[var(--accent)] bg-[var(--accent-light)]'
            : 'border-[var(--border)] hover:border-[var(--text-muted)]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg
          className="w-5 h-5 mx-auto mb-1 text-[var(--text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          />
        </svg>
        <p className="text-[11px] text-[var(--text-muted)]">
          Deposer vos documents (PDF, Excel, images)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[11px] px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-primary)]"
            >
              {f.status === 'uploading' && (
                <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              {f.status === 'done' && (
                <svg
                  className="w-3 h-3 text-[var(--success)] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {f.status === 'error' && (
                <svg
                  className="w-3 h-3 text-[var(--danger)] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {f.status === 'pending' && (
                <div className="w-3 h-3 rounded-full bg-[var(--border)] flex-shrink-0" />
              )}
              <span className="truncate text-[var(--text-secondary)]">{f.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
