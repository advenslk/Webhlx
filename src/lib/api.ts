const TOKEN_KEY = 'helzerx.session';

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

let memoryAuthToken: string | null = readStoredToken();

export function setAuthToken(token: string | null): void {
  memoryAuthToken = token;
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage can be disabled (private mode) — the in-memory session still works.
  }
}

export function getAuthToken(): string | null {
  return memoryAuthToken;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (memoryAuthToken) {
    headers.set('Authorization', `Bearer ${memoryAuthToken}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = { error: text };
    }
  }

  if (!response.ok) {
    const msg =
      typeof parsed.error === 'string'
        ? parsed.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(msg, response.status, parsed);
  }

  return parsed as T;
}
