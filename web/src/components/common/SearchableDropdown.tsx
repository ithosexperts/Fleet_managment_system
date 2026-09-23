import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  searchText?: string;
  icon?: React.ReactNode;
}

export interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  emptyLabel?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  searchable?: boolean;
  sortOptions?: boolean;
  showQuickClear?: boolean;
  width?: string | number;
  minWidth?: string | number;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  emptyLabel = 'No results found',
  multiple = false,
  disabled = false,
  required = false,
  className,
  style,
  buttonStyle,
  menuStyle,
  searchable,
  sortOptions = false,
  showQuickClear = true,
  width,
  minWidth
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [alignRight, setAlignRight] = useState(false);

  useEffect(() => {
    if (open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      const isNearRightEdge =
        rect.left + 280 > window.innerWidth ||
        (window.innerWidth - rect.right < 140) ||
        (rect.left > window.innerWidth / 2 && window.innerWidth - rect.right < 240);
      setAlignRight(isNearRightEdge);
    }
  }, [open]);

  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value !== undefined && value !== null && value !== '') return [String(value)];
    return [];
  }, [value]);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const normalizedQuery = query.trim().toLowerCase();

  const displayOptions = useMemo(() => {
    if (!sortOptions) return options;
    return [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, [options, sortOptions]);

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return displayOptions;
    return displayOptions.filter((option) =>
      `${option.label} ${option.searchText || ''}`.toLowerCase().includes(normalizedQuery)
    );
  }, [displayOptions, normalizedQuery]);

  const isSearchable = searchable ?? (options.length > 5);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && isSearchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, isSearchable]);

  const getDisplayLabel = () => {
    if (selectedValues.length === 0) return placeholder;

    if (!multiple) {
      const match = options.find((option) => option.value === selectedValues[0]);
      return match ? match.label : selectedValues[0] || placeholder;
    }

    const selectedLabels = selectedValues
      .map((val) => options.find((option) => option.value === val)?.label)
      .filter(Boolean) as string[];

    if (selectedLabels.length === 0) return placeholder;
    if (selectedLabels.length === 1) return selectedLabels[0];
    if (selectedLabels.length === 2) return selectedLabels.join(', ');
    return `${selectedLabels[0]}, +${selectedLabels.length - 1} more`;
  };

  const selectedTooltip = useMemo(() => {
    if (!multiple || selectedValues.length === 0) return undefined;
    return selectedValues
      .map((val) => options.find((option) => option.value === val)?.label)
      .filter(Boolean)
      .join(', ');
  }, [multiple, selectedValues, options]);

  const handleSelectOption = (optionValue: string) => {
    if (multiple) {
      const next = selectedSet.has(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(next);
    } else {
      onChange(optionValue);
      setOpen(false);
      setQuery('');
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allValues = filteredOptions.map((o) => o.value);
    const combined = Array.from(new Set([...selectedValues, ...allValues]));
    onChange(combined);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const handleQuickClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  return (
    <div
      ref={rootRef}
      className={`searchable-dropdown-container ${className || ''}`}
      style={{
        position: 'relative',
        width: width || style?.width || undefined,
        minWidth: minWidth || style?.minWidth || undefined,
        ...style
      }}
    >
      <button
        type="button"
        className="searchable-dropdown-trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={selectedTooltip}
        style={{
          width: '100%',
          ...buttonStyle
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedValues.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {getDisplayLabel()}
        </span>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {showQuickClear && selectedValues.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleQuickClear}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickClear(e as any)}
              title="Clear selection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--border-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            style={{
              color: 'var(--text-muted)',
              transition: 'transform 0.2s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
            aria-hidden="true"
          />
        </div>
      </button>

      {required && selectedValues.length === 0 && (
        <input
          required
          aria-hidden="true"
          tabIndex={-1}
          value=""
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />
      )}

      {open && (
        <div
          className="searchable-dropdown-menu"
          role="listbox"
          aria-multiselectable={multiple}
          style={{
            left: alignRight ? 'auto' : 0,
            right: alignRight ? 0 : 'auto',
            minWidth: width ? '100%' : '250px',
            maxWidth: 'min(380px, calc(100vw - 28px))',
            width: 'max-content',
            ...menuStyle
          }}
        >
          {isSearchable && (
            <div style={{ position: 'relative', marginBottom: '6px', padding: '2px' }}>
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search options..."
                aria-label="Search options"
                style={{
                  width: '100%',
                  padding: '6px 26px 6px 28px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 0,
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {multiple && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px 6px 6px',
                marginBottom: '4px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>
                {selectedValues.length} of {options.length} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    border: 0,
                    background: 'none',
                    color: 'var(--brand-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    padding: 0
                  }}
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={selectedValues.length === 0}
                  style={{
                    border: 0,
                    background: 'none',
                    color: selectedValues.length > 0 ? 'var(--text-muted)' : 'var(--border-strong)',
                    cursor: selectedValues.length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '0.72rem',
                    padding: 0
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const checked = selectedSet.has(option.value);

                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    key={option.value}
                    onClick={() => handleSelectOption(option.value)}
                    className={`searchable-dropdown-item ${checked ? 'is-selected' : ''}`}
                    title={option.label}
                  >
                    {multiple ? (
                      <span
                        className={`searchable-dropdown-checkbox ${checked ? 'is-checked' : ''}`}
                        aria-hidden="true"
                      >
                        {checked && <Check size={11} strokeWidth={3} color="#FFFFFF" />}
                      </span>
                    ) : null}

                    {option.icon && (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{option.icon}</span>
                    )}

                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {option.label}
                    </span>

                    {!multiple && checked && (
                      <Check size={14} strokeWidth={2.5} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
