import { asyncDelay } from '@/lib/utils'

/* ============================================================
 * API layer — currently serves mock data with simulated latency.
 * REPLACE the internals with fetch() calls to the FastAPI
 * backend later. Every public function keeps the same signature
 * so components require no changes.
 *
 *   const body = await api.get('/v1/maintenance/tasks', { dept: 'TMS' })
 * ============================================================ */

export const isMock = true

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.rail-planner.in'

const MOCK_LATENCY_MIN = 40
const MOCK_LATENCY_MAX = 140

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ApiOptions = {
  latency?: number
}

const handlers = new Map<string, (params: URLSearchParams, body?: unknown) => unknown | Promise<unknown>>()

export function mockEndpoint(
  method: string,
  pattern: string,
  handler: (params: URLSearchParams, body?: unknown) => unknown | Promise<unknown>,
) {
  handlers.set(`${method.toUpperCase()} ${pattern}`, handler)
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options: ApiOptions = {},
): Promise<T> {
  if (isMock) {
    const latency = options.latency ?? MOCK_LATENCY_MIN + Math.floor(Math.random() * (MOCK_LATENCY_MAX - MOCK_LATENCY_MIN))
    await asyncDelay(latency)

    const [pattern, query] = path.split('?')
    const key = `${method.toUpperCase()} ${pattern}`
    const handler = handlers.get(key)

    if (!handler) {
      // Fall back to GET / pattern with any method.
      const getHandler = handlers.get(`GET ${pattern}`)
      if (!getHandler) throw new ApiError(404, `No mock handler for ${key}`)
      return (await getHandler(new URLSearchParams(query ?? ''), body)) as T
    }
    return (await handler(new URLSearchParams(query ?? ''), body)) as T
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => apiRequest<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) => apiRequest<T>('POST', path, body, options),
  put: <T>(path: string, body: unknown, options?: ApiOptions) => apiRequest<T>('PUT', path, body, options),
  patch: <T>(path: string, body: unknown, options?: ApiOptions) => apiRequest<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: ApiOptions) => apiRequest<T>('DELETE', path, undefined, options),
}