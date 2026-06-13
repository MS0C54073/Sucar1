/**
 * Live Mapbox map behind login / register (lazy-loaded so the form always paints first).
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import './AuthMapBackground.css';

const LazyAuthMap = lazy(() => import('./AuthMapLayer'));

const AuthMapBackground = () => {
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowMap(true), 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="auth-map-bg" aria-hidden="true">
      <div className="auth-map-bg-fallback" />
      {showMap && (
        <Suspense fallback={null}>
          <LazyAuthMap />
        </Suspense>
      )}
      <div className="auth-map-bg-scrim" />
    </div>
  );
};

export default AuthMapBackground;
