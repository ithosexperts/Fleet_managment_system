import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, Loader2, X } from 'lucide-react';
import { searchPlaceSuggestions, abortPlaceSearch, PlaceSuggestion } from '../../services/geocoding';

interface Props {
  placeholder?: string;
  initialValue?: string;
  onSelect: (place: PlaceSuggestion) => void;
  savedDestinations?: Array<{ id: string; name: string; address: string; latitude: number; longitude: number }>;
  proximity?: { latitude: number; longitude: number };
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
}

export const LocationSearchInput: React.FC<Props> = ({
  placeholder = 'Search place, address, city or landmark...',
  initialValue = '',
  onSelect,
  savedDestinations = [],
  proximity,
  className = '',
  style,
  autoFocus = false
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchTimerRef = useRef<any>(null);
  const requestIdRef = useRef(0);
  const isTypingRef = useRef(false);

  // Sync external initialValue without triggering any search or opening the dropdown
  useEffect(() => {
    setQuery(initialValue || '');
    setIsOpen(false);
    setSuggestions([]);
    setLoading(false);
    requestIdRef.current++;
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    abortPlaceSearch();
    isTypingRef.current = false;
  }, [initialValue]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      abortPlaceSearch();
    };
  }, []);

  // Handle active user typing
  const handleInputChange = (newVal: string) => {
    setQuery(newVal);
    isTypingRef.current = true;

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const trimmed = newVal.trim();
    if (trimmed.length < 2) {
      requestIdRef.current++;
      abortPlaceSearch();
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    const currentReqId = ++requestIdRef.current;

    searchTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPlaceSuggestions(trimmed, proximity, savedDestinations);
        // Only display if this request is still the latest and user is still actively typing
        if (currentReqId === requestIdRef.current && isTypingRef.current) {
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Place search error:', err);
        }
      } finally {
        if (currentReqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 250);
  };

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (place: PlaceSuggestion) => {
    // 1. Immediately invalidate any pending or in-flight searches
    requestIdRef.current++;
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    abortPlaceSearch();

    // 2. Mark typing as inactive and close dropdown
    isTypingRef.current = false;
    setIsOpen(false);
    setSuggestions([]);
    setLoading(false);
    setSelectedIndex(-1);

    // 3. Set input text to selected place name
    setQuery(place.name);

    // 4. Trigger parent callback
    onSelect(place);
  };

  const handleClear = () => {
    requestIdRef.current++;
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    abortPlaceSearch();

    isTypingRef.current = false;
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setLoading(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />

        <input
          ref={inputRef}
          type="text"
          className={`form-input ${className}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && isTypingRef.current) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          style={{
            paddingLeft: '36px',
            paddingRight: query ? '36px' : '12px',
            fontSize: '0.85rem',
            height: '38px',
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        />

        {loading ? (
          <Loader2
            size={16}
            className="animate-spin"
            style={{
              position: 'absolute',
              right: '12px',
              color: 'var(--accent-whatsapp)',
              pointerEvents: 'none'
            }}
          />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '260px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {suggestions.map((place, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={place.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(place);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div
                  style={{
                    marginTop: '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: place.isSavedDestination ? 'rgba(37, 211, 102, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                    color: place.isSavedDestination ? 'var(--accent-whatsapp)' : '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {place.isSavedDestination ? <Building2 size={13} /> : <MapPin size={13} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {place.name}
                    </span>
                    {place.isSavedDestination && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(37, 211, 102, 0.2)',
                          color: 'var(--accent-whatsapp)'
                        }}
                      >
                        Saved Destination
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '2px'
                    }}
                  >
                    {place.address}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
