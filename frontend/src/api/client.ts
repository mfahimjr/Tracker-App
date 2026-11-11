// Thin fetch wrapper for the Laravel API. Sends the session cookie on every request.

export class ApiError extends Error {
  status: number
  // Laravel returns 422 as { message, errors: { field: [msg] } }.
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Sanctum sets the XSRF-TOKEN cookie; Laravel checks it against the X-XSRF-TOKEN header.
async function csrfToken(): Promise<string> {
  if (!readCookie('XSRF-TOKEN')) {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include', headers: { Accept: 'application/json' } })
  }
  return readCookie('XSRF-TOKEN') ?? ''
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? 'GET'
  const unsafe = method !== 'GET' && method !== 'HEAD'

  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(unsafe ? { 'X-XSRF-TOKEN': await csrfToken() } : {}),
      ...init.headers,
    },
  })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.message ?? res.statusText, body.errors ?? {})
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) }),
}
