'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

const EXPIRY_OPTIONS = [
  { label: 'Never (permanent)', value: 'never' },
  { label: '1 Hour', value: '1h' },
  { label: '6 Hours', value: '6h' },
  { label: '24 Hours', value: '24h' },
  { label: '3 Days', value: '3d' },
  { label: '1 Week', value: '1w' },
  { label: '1 Month', value: '1m' },
];

export function calculateExpiryDate(value) {
  if (!value || value === 'never') return null;

  const now = new Date();
  switch (value) {
    case '1h': return new Date(now.getTime() + 1 * 60 * 60 * 1000);
    case '6h': return new Date(now.getTime() + 6 * 60 * 60 * 1000);
    case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '3d': return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case '1w': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '1m': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

export function getExpiryLabel(expiresAt) {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Expires in < 1 hour';
  if (hours < 24) return `Expires in ${hours}h`;
  if (days < 7) return `Expires in ${days}d`;
  if (days < 30) return `Expires in ${Math.floor(days / 7)}w`;
  return `Expires in ${Math.floor(days / 30)}mo`;
}

export default function ExpirySelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = EXPIRY_OPTIONS.find(o => o.value === (value || 'never')) || EXPIRY_OPTIONS[0];

  return (
    <div className="expiry-selector" ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        type="button"
        className={`btn btn-sm ${value && value !== 'never' ? 'btn-danger' : 'btn-secondary'}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Auto-delete: ${selectedOption.label}`}
      >
        <Clock size={16} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '0.5rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          minWidth: '150px',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.25rem 0.5rem', fontWeight: 600 }}>
            Auto-Delete After
          </div>
          {EXPIRY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              style={{
                textAlign: 'left',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: value === opt.value ? 'var(--accent-primary-alpha)' : 'transparent',
                color: value === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
