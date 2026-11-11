import { useEffect } from 'react'
import { Button } from '../../components/ui'
import type { FileItem } from '../../store/types'
import type { PreviewKind } from './fileContent'

interface Props {
  file: FileItem
  // Object URL for the stored content, or null when the file has no content (demo data).
  url: string | null
  kind: PreviewKind
  onClose: () => void
}

export function FileViewer({ file, url, kind, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-nav/70 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={file.name}
        className="flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-bd bg-card shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-bd px-5 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{file.name}</h2>
            {file.note && <p className="truncate text-xs text-mu">{file.note}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            {url && (
              <a
                href={url}
                download={file.name}
                className="rounded-lg border border-bd bg-card px-3.5 py-2 text-sm font-medium text-tx shadow-card hover:bg-acs"
              >
                Download
              </a>
            )}
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-bg p-4">
          {!url && <p className="text-center text-mu">No content is stored for this file. It was added as demo data.</p>}
          {url && kind === 'image' && <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />}
          {url && kind === 'pdf' && <iframe src={url} title={file.name} className="size-full rounded-lg bg-card" />}
          {url && kind === 'none' && (
            <div className="text-center">
              <p className="mb-3 text-mu">This file type can't be previewed here.</p>
              <a href={url} download={file.name} className="font-medium text-ac hover:underline">
                Download {file.name}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
