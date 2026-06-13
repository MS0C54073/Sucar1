import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import './SearchAutocomplete.css';

export type SearchAutocompleteVariant = 'hero' | 'map';

export interface SearchAutocompleteItem {
  id: string;
  label: string;
  subtitle?: string;
}

interface SearchAutocompleteProps {
  items: SearchAutocompleteItem[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: SearchAutocompleteItem) => void;
  placeholder?: string;
  variant?: SearchAutocompleteVariant;
  emptyMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
  filterItem?: (item: SearchAutocompleteItem, query: string) => boolean;
  ariaLabel?: string;
  /** Stop map drag from stealing focus (map overlays) */
  stopMapPropagation?: boolean;
}

function defaultFilter(item: SearchAutocompleteItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const haystack = `${item.label} ${item.subtitle || ''}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

const SearchAutocomplete = ({
  items,
  value,
  onChange,
  onSelect,
  placeholder = 'Search…',
  variant = 'map',
  emptyMessage = 'No results match your search',
  loadingMessage = 'Loading…',
  isLoading = false,
  filterItem = defaultFilter,
  ariaLabel = 'Search',
  stopMapPropagation = variant === 'map',
}: SearchAutocompleteProps) => {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const suggestions = useMemo(() => {
    if (isLoading) return [];
    if (!value.trim()) return items.slice(0, 12);
    return items.filter((item) => filterItem(item, value)).slice(0, 12);
  }, [items, value, isLoading, filterItem]);

  const close = useCallback(() => {
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  useEffect(() => {
    const onDocPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
  }, [close]);

  const pick = useCallback(
    (item: SearchAutocompleteItem) => {
      onChange(item.label);
      onSelect(item);
      close();
      inputRef.current?.blur();
    },
    [onChange, onSelect, close]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        pick(suggestions[highlightIndex]);
      } else if (suggestions.length === 1) {
        pick(suggestions[0]);
      }
    }
  };

  /** Show suggestions on focus when we have items (recommendations), while typing, or when loading */
  const showList =
    open && (isLoading || items.length > 0 || value.trim().length > 0 || suggestions.length > 0);

  return (
    <div
      ref={rootRef}
      className={`sucar-search-ac sucar-search-ac--${variant}`}
      role="combobox"
      aria-expanded={showList}
      aria-haspopup="listbox"
      aria-controls={listId}
      onPointerDown={stopMapPropagation ? (e) => e.stopPropagation() : undefined}
    >
      <div className="sucar-floating-search">
        <span className="sucar-floating-search__icon" aria-hidden>
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="sucar-floating-search__input"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightIndex >= 0 ? `${listId}-opt-${highlightIndex}` : undefined
          }
        />
        {value ? (
          <button
            type="button"
            className="sucar-floating-search__clear"
            onClick={() => {
              onChange('');
              setOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {showList && (
        <ul id={listId} className="sucar-search-ac__list" role="listbox">
          {isLoading ? (
            <li className="sucar-search-ac__loading" role="status">
              {loadingMessage}
            </li>
          ) : suggestions.length === 0 ? (
            <li className="sucar-search-ac__empty" role="option" aria-disabled>
              {emptyMessage}
            </li>
          ) : (
            suggestions.map((item, index) => (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={highlightIndex === index}
                  className={`sucar-search-ac__option${highlightIndex === index ? ' is-active' : ''}`}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(item)}
                >
                  <span className="sucar-search-ac__name">{item.label}</span>
                  {item.subtitle ? (
                    <span className="sucar-search-ac__subtitle">{item.subtitle}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchAutocomplete;
