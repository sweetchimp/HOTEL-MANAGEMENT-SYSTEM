import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImageFile } from './uploadImage'

interface ImageUploaderProps {
  id?: string
  label?: string
  value: string | null
  onChange: (url: string | null) => void
  hint?: string
}

export default function ImageUploader({ id, label, value, onChange, hint }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined | null) {
    if (!file || busy) return
    setBusy(true)
    try {
      const url = await uploadImageFile(file)
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Upload failed', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  if (value) {
    return (
      <div className="space-y-1.5">
        {label && <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>}
        <div className="relative inline-block overflow-hidden rounded-lg border border-dust-300">
          <img src={value} alt="Uploaded preview" className="max-h-44 object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1.5 text-red-600 shadow-sm transition-colors hover:bg-red-50"
            aria-label="Remove image"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {hint && <p className="text-xs text-steel-500">{hint}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1a1a1a]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          void handleFile(e.dataTransfer.files?.[0])
        }}
        className={`flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-sm transition-colors ${
          dragging
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-dust-300 bg-dust-50/60 text-steel-500 hover:border-primary-400 hover:bg-primary-50/50'
        }`}
      >
        {busy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            <span>Uploading…</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-5 w-5 text-steel-400" />
            <span>Drop an image or click to browse</span>
            <span className="text-xs text-steel-400">JPG, PNG or WebP · max 4MB</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {hint && <p className="text-xs text-steel-500">{hint}</p>}
    </div>
  )
}
