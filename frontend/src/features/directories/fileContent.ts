// Uploaded file contents, keyed by FileItem.id. Like the rest of the demo store this lives in
// memory and is lost on reload. Once the API exists, files are served from private storage
// through authenticated download or short-lived signed URLs (spec 5.6), not from here.
const contents = new Map<string, Blob>()

export function saveFileContent(id: string, blob: Blob) {
  contents.set(id, blob)
}

export function getFileContent(id: string): Blob | undefined {
  return contents.get(id)
}

export function removeFileContent(id: string) {
  contents.delete(id)
}

// Only types the browser shows inline. SVG and HTML are left out, since they can run script.
const INLINE_IMAGE = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

export type PreviewKind = 'image' | 'pdf' | 'none'

export function previewKind(blob: Blob | undefined): PreviewKind {
  if (!blob) return 'none'
  if (INLINE_IMAGE.includes(blob.type)) return 'image'
  if (blob.type === 'application/pdf') return 'pdf'
  return 'none'
}
