import React, { useState } from 'react';

export default function Avatar({ src, name = '', size = 'medium', className = '' }) {
  const [hasError, setHasError] = useState(false);

  const sizes = {
    small: { width: '32px', height: '32px', fontSize: '12px' },
    medium: { width: '40px', height: '40px', fontSize: '14px' },
    large: { width: '56px', height: '56px', fontSize: '18px' },
  };

  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n[0].toUpperCase();
  };

  return (
    <div 
      className={`avatar ${className}`}
      style={sizes[size]}
    >
      {src && !hasError ? (
        <img 
          src={src} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
