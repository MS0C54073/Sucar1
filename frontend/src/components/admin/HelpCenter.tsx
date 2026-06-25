import { useState, useMemo } from 'react';
import { ONBOARDING_SECTIONS } from '../../services/onboarding-service';
import Icon from '../icons/Icon';
import './HelpCenter.css';

interface HelpCenterProps {
  onClose: () => void;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'DashboardHome', label: 'Dashboard' },
    { id: 'UserManagement', label: 'User Management' },
    { id: 'ManageBookings', label: 'Bookings' },
    { id: 'Analytics', label: 'Analytics' },
    { id: 'FinancialOverview', label: 'Financial' },
    { id: 'FeatureFlags', label: 'Feature Flags' },
    { id: 'Compliance', label: 'Compliance' },
    { id: 'Incidents', label: 'Incidents' },
  ];

  const filteredSections = useMemo(() => {
    return ONBOARDING_SECTIONS.filter((section) => {
      const matchesSearch =
        searchTerm === '' ||
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || section.component === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="help-center-overlay" onClick={onClose}>
      <div className="help-center" onClick={(e) => e.stopPropagation()}>
        <div className="help-center-header">
          <h2>Help Center</h2>
          <button className="help-center-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="help-center-search">
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="help-center-filters">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="help-center-content">
          {filteredSections.length === 0 ? (
            <div className="help-empty-state">
              <p>No help topics found matching your search.</p>
            </div>
          ) : (
            <div className="help-sections-list">
              {filteredSections.map((section) => (
                <div key={section.id} className="help-section-card">
                  <h3 className="help-section-title">{section.title}</h3>
                  <p className="help-section-description">{section.description}</p>
                  {section.component && (
                    <span className="help-section-location">
                      Location: {categories.find((c) => c.id === section.component)?.label || section.component}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
