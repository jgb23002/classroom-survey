export function buttonStyles(variant: 'primary' | 'secondary' = 'primary', className = '') {
  const shared =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const colors =
    variant === 'primary'
      ? 'bg-brand-800 text-white hover:bg-brand-900 disabled:hover:bg-brand-800'
      : 'border border-line bg-white text-ink hover:bg-stone-50';
  return `${shared} ${colors} ${className}`;
}
