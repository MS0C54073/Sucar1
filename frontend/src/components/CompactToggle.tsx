import { useEffect, useState } from 'react';

const CompactToggle = ({ className = '' }: { className?: string }) => {
  const [compact, setCompact] = useState<boolean>(() => localStorage.getItem('compactUI') === '1');

  useEffect(() => {
    if (compact) {
      document.documentElement.setAttribute('data-compact', '1');
    } else {
      document.documentElement.removeAttribute('data-compact');
    }
    localStorage.setItem('compactUI', compact ? '1' : '0');
  }, [compact]);

  return (
    <button
      className={`icon-btn ${className}`}
      title={compact ? 'Disable compact/mobile layout' : 'Enable compact/mobile layout'}
      onClick={() => setCompact(!compact)}
    >
      📱
    </button>
  );
};

export default CompactToggle;
