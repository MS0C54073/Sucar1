import './MapSearchInput.css';

interface MapSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

/** Floating map search — explicit colors so typed text is always visible */
const MapSearchInput = ({
  value,
  onChange,
  placeholder = 'Search…',
  onClear,
}: MapSearchInputProps) => {
  return (
    <div className="map-float-search map-float-search--client" role="search">
      <span className="map-float-search-icon" aria-hidden>
        🔍
      </span>
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="map-search-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search car washes"
      />
      {value ? (
        <button
          type="button"
          className="map-float-search-clear"
          onClick={() => (onClear ? onClear() : onChange(''))}
          aria-label="Clear search"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
};

export default MapSearchInput;
