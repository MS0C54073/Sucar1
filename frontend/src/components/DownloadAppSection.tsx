import React from 'react';
import Icon from './icons/Icon';
import './DownloadAppSection.css';

interface DownloadAppSectionProps {
  variant?: 'default' | 'compact';
  title?: string;
  description?: string;
}

const DownloadAppSection: React.FC<DownloadAppSectionProps> = ({
  variant = 'default',
  title = 'Download Our App',
  description = 'Experience SuCAR on the go. Download our mobile app for iOS and Android.',
}) => {
  // Placeholder URLs - replace with actual app store links when available
  const iosAppUrl = 'https://apps.apple.com/app/sucar'; // Replace with actual iOS app URL
  const androidAppUrl = 'https://play.google.com/store/apps/details?id=com.sucar'; // Replace with actual Android app URL

  const handleIOSDownload = () => {
    window.open(iosAppUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAndroidDownload = () => {
    window.open(androidAppUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className={`download-app-section ${variant}`}>
      <div className="download-app-container">
        {variant === 'default' && (
          <div className="download-app-header">
            <div className="download-app-icon-wrapper">
              <div className="download-app-icon"><Icon name="smartphone" size={36} /></div>
            </div>
            <h2 className="download-app-title">{title}</h2>
            <p className="download-app-description">{description}</p>
          </div>
        )}
        
        <div className="download-buttons-wrapper">
          <div className="download-buttons">
            {/* iOS App Store Button */}
            <a
              href={iosAppUrl}
              onClick={(e) => {
                e.preventDefault();
                handleIOSDownload();
              }}
              className="download-badge download-badge-ios"
              aria-label="Download on the App Store"
            >
              <div className="badge-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.894 20.327c-1.093 1.06-2.285.98-3.434.45-1.216-.56-2.32-.54-3.616 0-1.608.69-2.456.49-3.418-.45C5.112 17.03 5.92 9.49 10.1 9.17c1.508.08 2.556.83 3.44.89 1.318-.27 2.58-1.04 4.0-.94 1.688.13 2.96.81 3.8 2.01-3.488 2.09-2.66 6.68.536 7.97-.637 1.68-1.463 3.35-2.838 4.57l.01-.01zM13.43 8.1c-.17-2.49 1.85-4.55 4.18-4.75.324 2.88-2.61 5.03-4.18 4.75z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="badge-content">
                <span className="badge-label">Download on the</span>
                <span className="badge-store">App Store</span>
              </div>
            </a>

            {/* Google Play Button */}
            <a
              href={androidAppUrl}
              onClick={(e) => {
                e.preventDefault();
                handleAndroidDownload();
              }}
              className="download-badge download-badge-android"
              aria-label="Get it on Google Play"
            >
              <div className="badge-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.5 22.92V5.08c0-.69.4-1.3 1-1.52L15.31 14 4.5 23.44c-.6-.22-1-.83-1-1.52zm15.45-6.28L6.06 23.9l9.48-9.48 2.41 2.42zm0-5.28L6.06 4.1l9.48 9.48 2.41-2.42zM6.06 4.1L18.73 14 6.06 23.9V4.1z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="badge-content">
                <span className="badge-label">Get it on</span>
                <span className="badge-store">Google Play</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadAppSection;
