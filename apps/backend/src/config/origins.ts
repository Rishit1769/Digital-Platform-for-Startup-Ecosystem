const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://startup.rishit.codes',
  'http://startup.rishit.codes',
];

function splitOrigins(value?: string): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getAllowedOrigins(): string[] {
  return Array.from(
    new Set([
      ...DEFAULT_ALLOWED_ORIGINS,
      ...splitOrigins(process.env.FRONTEND_URL),
      ...splitOrigins(process.env.CORS_ORIGINS),
    ])
  );
}

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
}
