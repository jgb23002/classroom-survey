export function publicSurveyUrl(slug: string, origin: string): string {
  const normalizedOrigin = new URL(origin).origin;
  return new URL(`/s/${encodeURIComponent(slug)}`, normalizedOrigin).toString();
}

export function publicApplicationOrigin(
  configuredOrigin: string | undefined,
  browserOrigin: string,
): string {
  const candidate = configuredOrigin?.trim() || browserOrigin;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(
      'VITE_PUBLIC_APP_URL must be a valid HTTP(S) application origin. Fix it and restart Vite.',
    );
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'VITE_PUBLIC_APP_URL must be an HTTP(S) application origin without a path, query, credentials, or fragment. Fix it and restart Vite.',
    );
  }
  return parsed.origin;
}

export function isLocalPublicUrl(url: string): boolean {
  const hostname = new URL(url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function qrDownloadName(title: string): string {
  const safeTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${safeTitle || 'survey'}-qr.png`;
}
