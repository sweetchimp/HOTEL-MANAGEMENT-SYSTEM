import { api } from '../../services/api'

const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
}

export async function uploadImageFile(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Only JPG, PNG and WebP images are allowed')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 4MB or smaller')
  }
  const dataUrl = await readFileAsDataUrl(file)
  const res = await api.post<{ url: string }>('/upload/image', {
    filename: file.name,
    content_type: file.type,
    data_base64: dataUrl,
  })
  if (!res.success || !res.data) {
    throw new Error(res.error || 'Upload failed')
  }
  return res.data.url
}