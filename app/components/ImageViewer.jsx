'use client';

import React from 'react';
import { X } from 'lucide-react';

export default function ImageViewer({ src, alt, onClose }) {
  if (!src) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      padding: '2rem'
    }} onClick={onClose}>
      <button 
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10001 }}
        onClick={onClose}
      >
        <X size={32} />
      </button>
      <img 
        src={src} 
        alt={alt} 
        style={{ 
          maxWidth: '100%', maxHeight: '80vh', 
          objectFit: 'contain', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }} 
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
}
