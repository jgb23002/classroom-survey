const memoryTokens = new Map<string, string>();
const memorySuccess = new Set<string>();

function tokenKey(slug: string) {
  return `classroom-survey:token:${slug}`;
}

function successKey(slug: string) {
  return `classroom-survey:submitted:${slug}`;
}

export interface AnonymousTokenResult {
  token: string;
  persistent: boolean;
}

export function getAnonymousSurveyToken(slug: string): AnonymousTokenResult {
  const existingMemory = memoryTokens.get(slug);
  try {
    const existing = window.localStorage.getItem(tokenKey(slug));
    if (existing) {
      memoryTokens.set(slug, existing);
      return { token: existing, persistent: true };
    }
    const token = existingMemory ?? crypto.randomUUID();
    window.localStorage.setItem(tokenKey(slug), token);
    memoryTokens.set(slug, token);
    return { token, persistent: true };
  } catch {
    const token = existingMemory ?? crypto.randomUUID();
    memoryTokens.set(slug, token);
    return { token, persistent: false };
  }
}

export function markSurveySubmitted(slug: string) {
  memorySuccess.add(slug);
  try {
    window.localStorage.setItem(successKey(slug), 'true');
  } catch {
    // The in-memory marker remains useful for this page session.
  }
}

export function surveyWasSubmitted(slug: string): boolean {
  if (memorySuccess.has(slug)) return true;
  try {
    return window.localStorage.getItem(successKey(slug)) === 'true';
  } catch {
    return false;
  }
}
