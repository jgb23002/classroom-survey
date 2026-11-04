import { describe, expect, it } from 'vitest';
import {
  isLocalPublicUrl,
  publicApplicationOrigin,
  publicSurveyUrl,
  qrDownloadName,
} from './presentation';

describe('presentation URLs', () => {
  it('uses the deployed application origin and encoded public slug', () => {
    expect(publicSurveyUrl('x7 kf/2q', 'https://survey.example.edu/dashboard')).toBe(
      'https://survey.example.edu/s/x7%20kf%2F2q',
    );
  });

  it('prefers the configured public application origin and otherwise uses the browser origin', () => {
    expect(
      publicApplicationOrigin(' https://classroom-survey.pages.dev/ ', 'http://localhost:5173'),
    ).toBe('https://classroom-survey.pages.dev');
    expect(publicApplicationOrigin(undefined, 'http://localhost:5173')).toBe(
      'http://localhost:5173',
    );
  });

  it.each([
    'not-a-url',
    'file:///tmp/app',
    'https://user:password@classroom.example',
    'https://classroom.example/path',
    'https://classroom.example?private=value',
  ])('rejects an unsafe configured public application origin: %s', (origin) => {
    expect(() => publicApplicationOrigin(origin, 'http://localhost:5173')).toThrow(
      'VITE_PUBLIC_APP_URL',
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
