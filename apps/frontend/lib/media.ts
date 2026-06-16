const DEFAULT_PROXY_HOSTS = ['127.0.0.1', 'localhost', 'minio'];

function getProxyHosts(): Set<string> {
  const configuredHosts = (process.env.NEXT_PUBLIC_MEDIA_PROXY_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...DEFAULT_PROXY_HOSTS, ...configuredHosts]);
}

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url || !url.trim()) return undefined;

  const trimmed = url.trim();

  if (
    trimmed.startsWith('/media') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (getProxyHosts().has(parsed.hostname.toLowerCase())) {
      return `/media?src=${encodeURIComponent(trimmed)}`;
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
}
