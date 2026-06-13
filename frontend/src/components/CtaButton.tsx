/**
 * Signature SuCAR pill CTA with the hover label-swap motion.
 * Renders a <button> (for in-app navigation) or an <a> when `href` is given.
 */
import type { ReactNode } from 'react';
import Icon, { type IconName } from './icons/Icon';

interface CtaButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'ghost';
  icon?: IconName;
  /** Icon side. Default: trailing arrow on the right. Pass null for no icon. */
  iconRight?: boolean;
  /** Button type when not a link. Defaults to 'button'. */
  type?: 'button' | 'submit';
  disabled?: boolean;
  /** Full-width (forms/auth). */
  block?: boolean;
  className?: string;
}

const CtaButton = ({
  children,
  onClick,
  href,
  variant = 'primary',
  icon = 'arrowRight',
  iconRight = true,
  type = 'button',
  disabled = false,
  block = false,
  className,
}: CtaButtonProps) => {
  const cls = `su-cta su-cta--${variant}${block ? ' su-cta--block' : ''}${
    className ? ` ${className}` : ''
  }`;
  const glyph = (
    <span className="su-cta__icon">
      <Icon name={icon} size={18} />
    </span>
  );
  const label = (
    <span className="su-cta__label">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );

  const inner = (
    <>
      {!iconRight && glyph}
      {label}
      {iconRight && glyph}
    </>
  );

  if (href) {
    return (
      <a className={cls} href={href}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
};

export default CtaButton;
