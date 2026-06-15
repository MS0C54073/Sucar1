/**
 * Scroll-reveal wrapper — fades + lifts children into view on first intersect.
 * Zero dependencies (IntersectionObserver). Honors prefers-reduced-motion:
 * reduced users get the final state immediately (see LandingPage.css).
 */
import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger index — adds delay * 90ms. */
  delay?: number;
  /** Render element. Defaults to a div. */
  as?: ElementType;
  className?: string;
}

const Reveal = ({ children, delay = 0, as: Tag = 'div', className = '' }: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'reveal--in' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delay * 90}ms` }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
