const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Token stored in memory (not localStorage for XSS safety)
let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

export function getToken() {
  return accessToken;
}

// ─────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────
interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

function extractJsonFromMixedText(input: string): string | null {
  const firstObject = input.indexOf('{');
  const firstArray = input.indexOf('[');

  const startCandidates = [firstObject, firstArray].filter((idx) => idx >= 0);
  if (!startCandidates.length) return null;

  const start = Math.min(...startCandidates);
  const openChar = input[start];
  const closeChar = openChar === '{' ? '}' : ']';
  const end = input.lastIndexOf(closeChar);

  if (end <= start) return null;
  return input.slice(start, end + 1);
}

async function parseResponseBody(res: Response, path: string): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  const raw = await res.text();

  if (!contentType.includes('application/json')) {
    return raw;
  }

  // Some providers prepend an XSSI guard like ")]}'" before JSON.
  const cleaned = raw
    .replace(/^\uFEFF/, '') // UTF-8 BOM
    .replace(/^\)\]\}'\s*\n?/, '') // XSSI guard
    .trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Some proxies/backends prepend text like "null" before a JSON object.
    // Try to salvage the first object/array payload before failing hard.
    const extracted = extractJsonFromMixedText(cleaned);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch {
        // Ignore and throw the detailed parse error below.
      }
    }

    const parseError: any = new Error(`Invalid JSON response from ${path}`);
    parseError.response = {
      status: res.status,
      data: raw.slice(0, 300),
      contentType,
    };
    parseError.cause = err;
    throw parseError;
  }
}

async function request(path: string, options: RequestOptions = {}): Promise<any> {
  const { method = 'GET', body, isFormData = false } = options;

  const headers: Record<string, string> = { ...options.headers };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: 'include', // sends cookies (refreshToken)
  };

  if (body !== undefined) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  let res = await fetch(`${BASE_URL}${path}`, fetchOptions);

  // Auto-refresh on 401
  if (res.status === 401 && path !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await parseResponseBody(refreshRes, '/auth/refresh');
        const newToken = refreshData?.data?.accessToken;
        if (newToken) {
          setToken(newToken);
          headers['Authorization'] = `Bearer ${newToken}`;
          fetchOptions.headers = headers;
          res = await fetch(`${BASE_URL}${path}`, fetchOptions);
        }
      } else {
        // Refresh failed → redirect to login
        accessToken = null;
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    } catch {
      accessToken = null;
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
  }

  // Parse response
  const data = await parseResponseBody(res, path);

  if (!res.ok) {
    const error: any = new Error(data?.error || `Request failed with status ${res.status}`);
    error.response = { status: res.status, data };
    throw error;
  }

  return { data };
}

// ─────────────────────────────────────────────
// Axios-compatible interface
// ─────────────────────────────────────────────
export const api = {
  get: (path: string, config?: { params?: Record<string, any>; headers?: Record<string, string> }) => {
    let url = path;
    if (config?.params) {
      const qs = new URLSearchParams(
        Object.entries(config.params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      if (qs) url += `?${qs}`;
    }
    return request(url, { method: 'GET', headers: config?.headers });
  },

  post: (path: string, body?: any, config?: { headers?: Record<string, string>; isFormData?: boolean }) =>
    request(path, { method: 'POST', body, headers: config?.headers, isFormData: config?.isFormData }),

  put: (path: string, body?: any, config?: { headers?: Record<string, string>; isFormData?: boolean }) =>
    request(path, { method: 'PUT', body, headers: config?.headers, isFormData: config?.isFormData }),

  patch: (path: string, body?: any, config?: { headers?: Record<string, string> }) =>
    request(path, { method: 'PATCH', body, headers: config?.headers }),

  delete: (path: string, config?: { headers?: Record<string, string> }) =>
    request(path, { method: 'DELETE', headers: config?.headers }),
};
