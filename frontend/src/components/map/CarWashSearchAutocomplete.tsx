import { useMemo } from 'react';
import SearchAutocomplete, { SearchAutocompleteItem } from '../search/SearchAutocomplete';
import type { Coordinates } from '../../services/mappingService';

export interface CarWashSearchItem {
  id: string;
  name: string;
  carWashName?: string;
  location?: string;
  coords: Coordinates;
  services?: { id: string; name: string; price: number | string }[];
}

export type CarWashSearchVariant = 'map' | 'hero';

interface CarWashSearchAutocompleteProps {
  washes: CarWashSearchItem[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (wash: CarWashSearchItem) => void;
  placeholder?: string;
  variant?: CarWashSearchVariant;
  emptyMessage?: string;
  isLoading?: boolean;
}

function matchesWash(wash: CarWashSearchItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const name = wash.name.toLowerCase();
  const loc = (wash.location || '').toLowerCase();
  const alt = (wash.carWashName || '').toLowerCase();
  const serviceNames = (wash.services || []).map((s) => s.name.toLowerCase()).join(' ');
  const haystack = `${name} ${alt} ${loc} ${serviceNames}`;
  return terms.every((term) => haystack.includes(term));
}

const CarWashSearchAutocomplete = ({
  washes,
  value,
  onChange,
  onSelect,
  placeholder = 'Search car washes…',
  variant = 'map',
  emptyMessage = 'No car washes match your search',
  isLoading = false,
}: CarWashSearchAutocompleteProps) => {
  const items: SearchAutocompleteItem[] = useMemo(
    () =>
      washes.map((w) => ({
        id: w.id,
        label: w.name,
        subtitle: w.location,
      })),
    [washes]
  );

  const washById = useMemo(() => new Map(washes.map((w) => [w.id, w])), [washes]);

  return (
    <SearchAutocomplete
      items={items}
      value={value}
      onChange={onChange}
      onSelect={(item) => {
        const wash = washById.get(item.id);
        if (wash) onSelect(wash);
      }}
      placeholder={placeholder}
      variant={variant === 'hero' ? 'hero' : 'map'}
      emptyMessage={isLoading ? 'Loading car washes…' : emptyMessage}
      isLoading={isLoading}
      filterItem={(item, query) => {
        const wash = washById.get(item.id);
        return wash ? matchesWash(wash, query) : false;
      }}
      ariaLabel="Search car washes"
      stopMapPropagation={variant === 'map'}
    />
  );
};

export default CarWashSearchAutocomplete;
