import React from 'react';

export default function Button({ children, type = 'button', variant = 'primary', className = '', loading = false, disabled = false, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {loading && (
        <span 
          className="spinner" 
          style={{ 
            width: '14px', 
            height: '14px', 
            borderWidth: '2px', 
            marginRight: '6px',
            animationDuration: '0.6s'
          }}
        ></span>
      )}
      {children}
    </button>
  );
}
