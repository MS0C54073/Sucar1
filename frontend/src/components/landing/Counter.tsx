/**
 * Count-up number — tweens from 0 to `value` when scrolled into view.
 * Zero dependencies (IntersectionObserver + rAF). Reduced-motion users see the
 * final value immediately with no animation.
 */
import { useEffect, useRef, useState } from 'react';

interface CounterProps {
  value: number;
  /** Rendered after the number, e.g. "+", "%", "k". */
  suffix?: string;
  prefix?: string;
  durationMs?: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const format = (n: number) => Math.round(n).toLocaleString('en-US');

const Counter = ({ value, suffix = '', prefix = '', durationMs = 1600 }: CounterProps) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
          setDisplay(value * eased);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
};

export default Counter;
