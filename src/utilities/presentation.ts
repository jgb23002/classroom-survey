export function publicSurveyUrl(slug: string, origin: string): string {
  const normalizedOrigin = new URL(origin).origin;
  return new URL(`/s/${encodeURIComponent(slug)}`, normalizedOrigin).toString();
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
