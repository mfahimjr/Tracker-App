import { useEffect, useState } from 'react'
import { FormDialog, type FieldDef, type FormValues } from '../components/FormDialog'
import { Button, Card, TableScroll, td, th } from '../components/ui'
import { countFiles, mapAt, namesAlong, nodeAt } from '../features/directories/tree'
import { FileViewer } from '../features/directories/FileViewer'
import {
  getFileContent,
  previewKind,
  removeFileContent,
  saveFileContent,
  type PreviewKind,
} from '../features/directories/fileContent'
import { newId } from '../store/demo'
import { useData } from '../store/useData'
import type { FileItem, FolderNode } from '../store/types'
import { useFeedback } from '../feedback/useFeedback'

type Dialog =
  | { kind: 'newFolder' }
  | { kind: 'renameFolder'; folder: FolderNode }
  | { kind: 'upload' }
  | { kind: 'editFile'; file: FileItem }
  | { kind: 'view'; file: FileItem; url: string | null; preview: PreviewKind }
  | null

const FOLDER_FIELDS: FieldDef[] = [{ key: 'name', label: 'Folder name' }]
const UPLOAD_FIELDS: FieldDef[] = [
  { key: 'file', label: 'File', type: 'file' },
  { key: 'note', label: 'Description / documentation note', type: 'area' },
]
const EDIT_FILE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'File name' },
  { key: 'note', label: 'Description', type: 'area' },
]

export default function DirectoriesPage() {
  const { data, update } = useData()
  const { toast, confirm } = useFeedback()
  const [path, setPath] = useState<string[]>([])
  const [dialog, setDialog] = useState<Dialog>(null)

  const folder = nodeAt(data.root, path)
  const crumbs = namesAlong(data.root, path)

  // Each opened file gets an object URL. Releasing it when the dialog changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (dialog?.kind === 'view' && dialog.url) URL.revokeObjectURL(dialog.url)
    }
  }, [dialog])

  function openFile(file: FileItem) {
    const blob = getFileContent(file.id)
    setDialog({
      kind: 'view',
      file,
      url: blob ? URL.createObjectURL(blob) : null,
      preview: previewKind(blob),
    })
  }

  // Folder names are unique within a parent, ignoring case (spec 5.6).
  function nameTaken(name: string, exceptId?: string) {
    return folder.folders.some((f) => f.id !== exceptId && f.name.toLowerCase() === name.toLowerCase())
  }

  function change(fn: (node: FolderNode) => FolderNode) {
    update((d) => ({ ...d, root: mapAt(d.root, path, fn) }))
  }

  function saveFolder(values: FormValues, existing?: FolderNode) {
    const name = String(values.name).trim()
    if (!name) return 'Enter a folder name.'
    if (nameTaken(name, existing?.id)) return 'A folder with this name already exists here.'
    change((node) =>
      existing
        ? { ...node, folders: node.folders.map((f) => (f.id === existing.id ? { ...f, name } : f)) }
        : { ...node, folders: [...node.folders, { id: newId(), name, folders: [], files: [] }] },
    )
    setDialog(null)
  }

  async function deleteFolder(f: FolderNode) {
    const nonEmpty = f.folders.length > 0 || countFiles(f) > 0
    const message = nonEmpty ? `Delete "${f.name}" and everything inside it?` : `Delete the empty folder "${f.name}"?`
    if (!(await confirm(message))) return
    change((node) => ({ ...node, folders: node.folders.filter((x) => x.id !== f.id) }))
  }

  function saveUpload(values: FormValues) {
    const picked = values.file
    if (!(picked instanceof File)) return 'Choose a file to upload.'
    const id = newId()
    saveFileContent(id, picked)
    change((node) => ({ ...node, files: [...node.files, { id, name: picked.name, note: String(values.note).trim() }] }))
    toast(`${picked.name} uploaded.`)
    setDialog(null)
  }

  function saveFile(values: FormValues, file: FileItem) {
    const name = String(values.name).trim()
    if (!name) return 'Enter a file name.'
    change((node) => ({
      ...node,
      files: node.files.map((x) => (x.id === file.id ? { ...x, name, note: String(values.note).trim() } : x)),
    }))
    setDialog(null)
  }

  async function deleteFile(file: FileItem) {
    if (!(await confirm(`Delete the file "${file.name}"?`))) return
    removeFileContent(file.id)
    change((node) => ({ ...node, files: node.files.filter((x) => x.id !== file.id) }))
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {path.length > 0 && (
            <Button variant="ghost" onClick={() => setPath(path.slice(0, -1))}>← Up</Button>
          )}
          <Button variant="ghost" onClick={() => setPath([])}>Directories</Button>
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              /
              <Button variant="ghost" onClick={() => setPath(path.slice(0, i + 1))}>{c.name}</Button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDialog({ kind: 'newFolder' })}>+ New folder</Button>
          <Button variant="primary" onClick={() => setDialog({ kind: 'upload' })}>Upload file</Button>
        </div>
      </div>

      <Card>
        <TableScroll>
          <table className="w-full min-w-150 border-collapse">
            <thead>
              <tr>
                {['Name', 'Description', ''].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {folder.folders.length === 0 && folder.files.length === 0 && (
                <tr><td colSpan={3} className="py-3 text-mu">Empty. Create a folder or upload a file.</td></tr>
              )}
              {folder.folders.map((f) => (
                <tr key={f.id}>
                  <td className={td}>
                    <button
                      type="button"
                      onClick={() => setPath([...path, f.id])}
                      className="cursor-pointer font-semibold text-ac hover:underline"
                    >
                      {f.name}
                    </button>
                  </td>
                  <td className={td + ' text-mu'}>{f.folders.length} folders · {countFiles(f)} files</td>
                  <td className={td + ' whitespace-nowrap'}>
                    <Button variant="ghost" onClick={() => setDialog({ kind: 'renameFolder', folder: f })}>Rename</Button>
                    <Button variant="danger" onClick={() => void deleteFolder(f)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {folder.files.map((x) => (
                <tr key={x.id}>
                  <td className={td}>
                    <button
                      type="button"
                      onClick={() => openFile(x)}
                      className="cursor-pointer text-left hover:text-ac hover:underline"
                    >
                      {x.name}
                    </button>
                  </td>
                  <td className={td}>{x.note}</td>
                  <td className={td + ' whitespace-nowrap'}>
                    <Button variant="ghost" onClick={() => openFile(x)}>View</Button>
                    <Button variant="ghost" onClick={() => setDialog({ kind: 'editFile', file: x })}>Edit</Button>
                    <Button variant="danger" onClick={() => void deleteFile(x)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>

      {dialog?.kind === 'newFolder' && (
        <FormDialog title="New folder" fields={FOLDER_FIELDS} onSubmit={(v) => saveFolder(v)} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'renameFolder' && (
        <FormDialog
          title="Rename folder"
          fields={FOLDER_FIELDS}
          initial={{ name: dialog.folder.name }}
          onSubmit={(v) => saveFolder(v, dialog.folder)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'upload' && (
        <FormDialog title="Upload file" fields={UPLOAD_FIELDS} submitLabel="Upload" onSubmit={saveUpload} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'view' && (
        <FileViewer file={dialog.file} url={dialog.url} kind={dialog.preview} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'editFile' && (
        <FormDialog
          title="Edit file"
          fields={EDIT_FILE_FIELDS}
          initial={{ name: dialog.file.name, note: dialog.file.note }}
          onSubmit={(v) => saveFile(v, dialog.file)}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
