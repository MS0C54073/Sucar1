import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { formatKwacha, parsePrice, Coordinates } from '../../services/mappingService';
import './CarWashDetailPanel.css';

export interface CarWashDetail {
  id: string;
  name?: string;
  carWashName?: string;
  location?: string;
  coords?: Coordinates;
  services?: { id: string; name: string; price: number | string }[];
}

interface CarWashDetailPanelProps {
  carWash: CarWashDetail;
  userLocation?: Coordinates | null;
  onClose: () => void;
  onBook: (carWashId: string, serviceId?: string) => void;
  /** Draw route on map + open external maps */
  onRoute?: () => void;
}

const CarWashDetailPanel = ({
  carWash,
  onClose,
  onBook,
  onRoute,
}: CarWashDetailPanelProps) => {
  const servicesRef = useRef<HTMLDivElement>(null);
  const title = carWash.carWashName || carWash.name || 'Car wash';
  const hasServices = carWash.services && carWash.services.length > 0;

  const { data: services, isLoading } = useQuery({
    queryKey: ['carwash-services', carWash.id],
    queryFn: async () => {
      const res = await api.get(`/carwash/services?carWashId=${carWash.id}`);
      return res.data.data || [];
    },
    enabled: !hasServices && Boolean(carWash.id),
    staleTime: 60000,
  });

  const list = hasServices ? carWash.services! : services || [];

  const handleRoute = () => {
    if (onRoute) {
      onRoute();
      return;
    }
  };

  const handleView = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="carwash-detail-panel" role="dialog" aria-label={`${title} details`}>
      <div className="carwash-detail-head">
        <div>
          <h3>{title}</h3>
          {carWash.location && <p className="carwash-detail-loc">{carWash.location}</p>}
        </div>
        <button type="button" className="carwash-detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="carwash-detail-actions">
        <button
          type="button"
          className="carwash-detail-action carwash-detail-action--route"
          onClick={handleRoute}
          disabled={!carWash.coords && !onRoute}
        >
          <span aria-hidden>🧭</span>
          Route
        </button>
        <button type="button" className="carwash-detail-action carwash-detail-action--view" onClick={handleView}>
          <span aria-hidden>👁</span>
          View
        </button>
        <button
          type="button"
          className="carwash-detail-action carwash-detail-action--book"
          onClick={() => onBook(carWash.id)}
        >
          <span aria-hidden>📅</span>
          Book
        </button>
      </div>

      <div className="carwash-detail-body" ref={servicesRef}>
        <h4>Services</h4>
        {isLoading && !hasServices ? (
          <LoadingSpinner size="sm" />
        ) : list.length === 0 ? (
          <p className="carwash-detail-empty">No services listed yet. Tap Book to continue.</p>
        ) : (
          <ul className="carwash-detail-services">
            {list.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <span>K{formatKwacha(parsePrice(s.price))}</span>
                </div>
                <button type="button" className="carwash-detail-book-btn" onClick={() => onBook(carWash.id, s.id)}>
                  Book
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="carwash-detail-primary" onClick={() => onBook(carWash.id)}>
        Book at this location
      </button>
    </div>
  );
};

export default CarWashDetailPanel;
