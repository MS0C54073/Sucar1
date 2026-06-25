import { useMemo } from 'react';
import SearchAutocomplete, { SearchAutocompleteItem } from './SearchAutocomplete';

export interface JobSearchBooking {
  id: string;
  status?: string;
  pickupLocation?: string;
  clientId?: { name?: string };
  clientName?: string;
  carWashId?: { name?: string; carWashName?: string };
  vehicleId?: { make?: string; model?: string; plateNo?: string };
}

interface JobSearchAutocompleteProps {
  bookings: JobSearchBooking[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (booking: JobSearchBooking) => void;
  placeholder?: string;
}

function matchesJob(booking: JobSearchBooking, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const haystack = [
    booking.pickupLocation,
    booking.clientId?.name,
    booking.clientName,
    booking.carWashId?.carWashName,
    booking.carWashId?.name,
    booking.vehicleId?.plateNo,
    booking.vehicleId?.make,
    booking.vehicleId?.model,
    booking.status?.replace(/_/g, ' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

const JobSearchAutocomplete = ({
  bookings,
  value,
  onChange,
  onSelect,
  placeholder = 'Search jobs by client, location, plate…',
}: JobSearchAutocompleteProps) => {
  const items: SearchAutocompleteItem[] = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        label: b.clientId?.name || b.clientName || 'Customer',
        subtitle: b.pickupLocation || b.status?.replace(/_/g, ' '),
      })),
    [bookings]
  );

  const bookingById = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);

  return (
    <SearchAutocomplete
      items={items}
      value={value}
      onChange={onChange}
      onSelect={(item) => {
        const booking = bookingById.get(item.id);
        if (booking) onSelect(booking);
      }}
      placeholder={placeholder}
      variant="map"
      emptyMessage="No jobs match your search"
      filterItem={(item, query) => {
        const booking = bookingById.get(item.id);
        return booking ? matchesJob(booking, query) : false;
      }}
      ariaLabel="Search jobs"
      stopMapPropagation
    />
  );
};

export default JobSearchAutocomplete;
