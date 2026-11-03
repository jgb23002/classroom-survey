import type { ReactNode } from 'react';

const paths = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  book: (
    <>
      <path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z" />
      <path d="M13 7a3 3 0 0 1 3-3h4v14h-3a4 4 0 0 0-4 3" />
    </>
  ),
  message: <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3V11.5a8.5 8.5 0 0 1 17 0Z" />,
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M9 15v-4m5 4V6m5 9v-7" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export function Icon({ name, className = '' }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
