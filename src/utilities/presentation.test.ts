import { describe, expect, it } from 'vitest';
import { isLocalPublicUrl, publicSurveyUrl, qrDownloadName } from './presentation';

describe('presentation URLs', () => {
  it('uses the deployed application origin and encoded public slug', () => {
    expect(publicSurveyUrl('x7 kf/2q', 'https://survey.example.edu/dashboard')).toBe(
      'https://survey.example.edu/s/x7%20kf%2F2q',
    );
  });

  it('identifies local-only URLs without treating production as local', () => {
    expect(isLocalPublicUrl('http://localhost:5173/s/slug')).toBe(true);
    expect(isLocalPublicUrl('https://classroom.pages.dev/s/slug')).toBe(false);
  });

  it('creates a safe PNG filename', () => {
    expect(qrDownloadName(' Recursion: Concept Check! ')).toBe('recursion-concept-check-qr.png');
  });
});
