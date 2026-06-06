import React from 'react';

export default function Spinner({ size = 'medium', className = '' }) {
  const sizes = {
    small: { width: '20px', height: '20px', borderWidth: '2px' },
    medium: { width: '40px', height: '40px', borderWidth: '4px' },
    large: { width: '60px', height: '60px', borderWidth: '5px' },
  };

  return (
    <div className={`spinner-container ${className}`}>
      <div 
        className="spinner" 
        style={sizes[size]}
      ></div>
    </div>
  );
}
