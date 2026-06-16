const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

let accessToken: string | null = null;

type HeadersMap = Record<string, string>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: HeadersMap;
  isFormData?: boolean;
}

interface RequestConfig {
  params?: QueryParams;
  headers?: HeadersMap;
  isFormData?: boolean;
}

type ApiResponse<T = any> = { data: T };

type ApiError = Error & {
  response: {
    status: number;
    data: unknown;
  };
};

export function setToken(token: string | null) {
  accessToken = token;
}

export function getToken() {
  return accessToken;
}

function extractJsonFromMixedText(input: string): string | null {
  const firstObject = input.indexOf('{');
  const firstArray = input.indexOf('[');
  const startCandidates = [firstObject, firstArray].filter((index) => index >= 0);

  if (startCandidates.length === 0) {
    return null;
  }

  const start = Math.min(...startCandidates);
  const openChar = input[start];
  const closeChar = openChar === '{' ? '}' : ']';
  const end = input.lastIndexOf(closeChar);

  return end > start ? input.slice(start, end + 1) : null;
}

function stripInvalidJsonPrefixes(input: string): string {
  let text = input.trim();
  const primitivePrefixPattern = /^(?:null|true|false)\s*/;

  while (primitivePrefixPattern.test(text) && /[\[{]/.test(text)) {
    text = text.replace(primitivePrefixPattern, '');
  }

  return text.replace(/^[,;]+\s*/, '');
}

function normalizeRawText(raw: string): string {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/^\)\]\}'\s*\n?/, '')
    .trim();
}

function tryParseJson(raw: string): unknown {
  const cleaned = normalizeRawText(raw);

  if (!cleaned) {
    return null;
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const stripped = stripInvalidJsonPrefixes(cleaned);

    if (stripped !== cleaned) {
      try {
        return JSON.parse(stripped);
      } catch {
        // Fall through to mixed text extraction.
      }
    }

    const extracted = extractJsonFromMixedText(stripped || cleaned);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch {
        // Fall through to returning the raw body.
      }
    }
  }

  return raw;
}

async function parseResponseBody(response: Response, path: string): Promise<unknown> {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  const parsed = tryParseJson(raw);
  const contentType = response.headers.get('content-type') || '';
  const expectsJson =
    contentType.includes('application/json') ||
    contentType.includes('application/problem+json') ||
    /^[\[{]/.test(normalizeRawText(raw));

  if (expectsJson && typeof parsed === 'string') {
    console.warn(`[api] Malformed JSON from ${path}`, {
      status: response.status,
      contentType,
      sample: raw.slice(0, 300),
    });
  }

  return parsed;
}

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) {
    return path;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  if (!queryString) {
    return path;
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${queryString}`;
}

function createError(status: number, data: unknown): ApiError {
  const messageFromObject =
    typeof data === 'object' && data !== null
      ? data && ('error' in data || 'message' in data)
        ? String((data as { error?: unknown; message?: unknown }).error || (data as { error?: unknown; message?: unknown }).message)
        : null
      : null;
  const messageFromString = typeof data === 'string' && data.trim() ? data.trim() : null;
  const error = new Error(messageFromObject || messageFromString || `Request failed with status ${status}`) as ApiError;

  error.response = { status, data };
  return error;
}

function createHeaders(headers?: HeadersMap): Headers {
  const mergedHeaders = new Headers(headers);

  if (accessToken) {
    mergedHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  return mergedHeaders;
}

async function fetchWithAuthRetry(path: string, options: RequestInit): Promise<Response> {
  let response = await fetch(`${BASE_URL}${path}`, options);

  if (response.status !== 401 || path === '/auth/refresh') {
    return response;
  }

  try {
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!refreshResponse.ok) {
      throw new Error('Session expired');
    }

    const refreshData = await parseResponseBody(refreshResponse, '/auth/refresh');
    const newToken =
      typeof refreshData === 'object' && refreshData !== null
        ? (refreshData as { data?: { accessToken?: string } }).data?.accessToken
        : null;

    if (!newToken) {
      throw new Error('Session expired');
    }

    setToken(newToken);

    const retryHeaders = new Headers(options.headers);
    retryHeaders.set('Authorization', `Bearer ${newToken}`);

    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: retryHeaders,
    });

    return response;
  } catch {
    accessToken = null;

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new Error('Session expired');
  }
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers, isFormData = false } = options;
  const requestHeaders = createHeaders(headers);
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include',
  };

  if (body !== undefined) {
    fetchOptions.body = isFormData ? (body as BodyInit) : JSON.stringify(body);

    if (!isFormData && !requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }
  }

  const response = await fetchWithAuthRetry(path, fetchOptions);
  const data = await parseResponseBody(response, path);

  if (!response.ok) {
    throw createError(response.status, data);
  }

  return { data: data as T };
}

export const api = {
  get: <T = any>(path: string, config?: Omit<RequestConfig, 'isFormData'>) =>
    request<T>(buildUrl(path, config?.params), { method: 'GET', headers: config?.headers }),

  post: <T = any>(path: string, body?: any, config?: RequestConfig) =>
    request<T>(path, { method: 'POST', body, headers: config?.headers, isFormData: config?.isFormData }),

  put: <T = any>(path: string, body?: any, config?: RequestConfig) =>
    request<T>(path, { method: 'PUT', body, headers: config?.headers, isFormData: config?.isFormData }),

  patch: <T = any>(path: string, body?: any, config?: RequestConfig) =>
    request<T>(path, { method: 'PATCH', body, headers: config?.headers, isFormData: config?.isFormData }),

  delete: <T = any>(path: string, config?: Omit<RequestConfig, 'params' | 'isFormData'>) =>
    request<T>(path, { method: 'DELETE', headers: config?.headers }),
};
