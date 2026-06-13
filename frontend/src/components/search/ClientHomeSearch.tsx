import { useMemo } from 'react';
import SearchAutocomplete, { SearchAutocompleteItem } from './SearchAutocomplete';
import './ClientHomeSearch.css';
import type { ExplorerCarWash } from '../map/CarWashMapExplorer';

export interface HomeServiceOption {
  id: string;
  title: string;
  desc: string;
  price: string;
}

export type HomeSearchSelection =
  | { type: 'service'; serviceId: string; label: string }
  | { type: 'carwash'; wash: ExplorerCarWash };

interface ClientHomeSearchProps {
  services: HomeServiceOption[];
  carWashes: ExplorerCarWash[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (pick: HomeSearchSelection) => void;
  isLoading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
}

function buildItems(
  services: HomeServiceOption[],
  carWashes: ExplorerCarWash[]
): SearchAutocompleteItem[] {
  const serviceItems: SearchAutocompleteItem[] = services.map((s) => ({
    id: `service:${s.id}`,
    label: s.title,
    subtitle: `${s.desc} · ${s.price}`,
  }));

  const washItems: SearchAutocompleteItem[] = carWashes.map((w) => ({
    id: `wash:${w.id}`,
    label: w.name,
    subtitle: w.location ? `📍 ${w.location}` : 'Car wash in Lusaka',
  }));

  return [...serviceItems, ...washItems];
}

function parseSelection(
  item: SearchAutocompleteItem,
  services: HomeServiceOption[],
  carWashes: ExplorerCarWash[]
): HomeSearchSelection | null {
  if (item.id.startsWith('service:')) {
    const serviceId = item.id.replace('service:', '');
    const service = services.find((s) => s.id === serviceId);
    if (service) return { type: 'service', serviceId: service.id, label: service.title };
  }
  if (item.id.startsWith('wash:')) {
    const washId = item.id.replace('wash:', '');
    const wash = carWashes.find((w) => w.id === washId);
    if (wash) return { type: 'carwash', wash };
  }
  return null;
}

const ClientHomeSearch = ({
  services,
  carWashes,
  value,
  onChange,
  onSelect,
  isLoading = false,
  loadError = false,
  onRetry,
}: ClientHomeSearchProps) => {
  const items = useMemo(() => buildItems(services, carWashes), [services, carWashes]);

  const emptyMessage = loadError
    ? 'Could not load locations. Tap to retry.'
    : isLoading
      ? 'Loading…'
      : 'No matches — try “Sparkle”, “Standard”, or a Lusaka area';

  return (
    <div className="client-home-search">
      <SearchAutocomplete
        items={items}
        value={value}
        onChange={onChange}
        onSelect={(item) => {
          if (loadError && onRetry) {
            onRetry();
            return;
          }
          const pick = parseSelection(item, services, carWashes);
          if (pick) onSelect(pick);
        }}
        variant="hero"
        isLoading={isLoading}
        placeholder="Search services or car washes…"
        emptyMessage={emptyMessage}
        loadingMessage="Loading car washes…"
        ariaLabel="Search services and car washes"
        stopMapPropagation={false}
      />
      {!isLoading && !loadError && carWashes.length > 0 && (
        <div className="client-home-search__recs" aria-label="Recommended car washes">
          <span className="client-home-search__recs-label">Recommended</span>
          <div className="client-home-search__recs-chips">
            {carWashes.slice(0, 4).map((w) => (
              <button
                key={w.id}
                type="button"
                className="client-home-search__chip"
                onClick={() => onSelect({ type: 'carwash', wash: w })}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {loadError && onRetry && (
        <button type="button" className="client-home-search__retry" onClick={onRetry}>
          Retry loading car washes
        </button>
      )}
    </div>
  );
};

export default ClientHomeSearch;
