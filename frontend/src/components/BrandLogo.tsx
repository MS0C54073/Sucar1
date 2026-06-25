import './BrandLogo.css';

export const BRAND_LOGO_SRC = '/images/Sucarcar.jpeg';

interface BrandLogoProps {
  /** Show the "SuCar" wordmark next to the mark */
  showText?: boolean;
  /** Logo mark size in pixels */
  size?: number;
  /** Wordmark text color; defaults to inherit */
  textClassName?: string;
  className?: string;
  /** Accessible label when no visible text is shown */
  label?: string;
}

const BrandLogo = ({
  showText = true,
  size = 32,
  textClassName,
  className,
  label = 'SuCar',
}: BrandLogoProps) => {
  return (
    <span className={`brand-logo${className ? ` ${className}` : ''}`}>
      <img
        src={BRAND_LOGO_SRC}
        alt={showText ? '' : label}
        className="brand-logo__mark"
        style={{ width: size, height: size }}
        width={size}
        height={size}
        loading="eager"
        decoding="async"
      />
      {showText && (
        <span className={`brand-logo__text${textClassName ? ` ${textClassName}` : ''}`}>
          SuCar
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
