import type { FolderNode } from '../../store/types'

// Folders are addressed by their id path from the root, e.g. [operationsId, templatesId].
export function nodeAt(root: FolderNode, path: string[]): FolderNode {
  let node = root
  for (const id of path) {
    const next = node.folders.find((f) => f.id === id)
    if (!next) return node
    node = next
  }
  return node
}

// Returns a copy of the tree with the folder at `path` replaced by change(folder).
export function mapAt(root: FolderNode, path: string[], change: (node: FolderNode) => FolderNode): FolderNode {
  if (path.length === 0) return change(root)
  const [head, ...rest] = path
  return { ...root, folders: root.folders.map((f) => (f.id === head ? mapAt(f, rest, change) : f)) }
}

export function countFiles(node: FolderNode): number {
  return node.files.length + node.folders.reduce((sum, f) => sum + countFiles(f), 0)
}

// Names along a path, for the breadcrumb.
export function namesAlong(root: FolderNode, path: string[]): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = []
  let node = root
  for (const id of path) {
    const next = node.folders.find((f) => f.id === id)
    if (!next) break
    out.push({ id, name: next.name })
    node = next
  }
  return out
}
