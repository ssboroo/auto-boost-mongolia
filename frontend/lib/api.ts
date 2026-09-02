export const API_BASE =
  process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  })

  const text = await response.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const raw = data?.message || data?.error || `API алдаа (${response.status})`
    const message = Array.isArray(raw) ? raw.join(', ') : typeof raw === 'object' ? JSON.stringify(raw) : String(raw)
    throw new Error(message)
  }

  return data as T
}
