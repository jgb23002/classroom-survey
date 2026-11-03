import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { buttonStyles } from '../utilities/buttonStyles';

type Variant = 'primary' | 'secondary';

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonStyles(variant, className)} {...props} />;
}

export function LinkButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: LinkProps & { variant?: Variant }) {
  return (
    <Link className={buttonStyles(variant, className)} {...props}>
      {children}
    </Link>
  );
}
