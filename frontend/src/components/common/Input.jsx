import React from 'react';

export default function Input({ label, type = 'text', error, className = '', id, ...props }) {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;
  return (
    <div className="form-group" style={{ width: '100%' }}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input
        type={type}
        id={inputId}
        className={`form-control ${className}`}
        style={error ? { borderColor: 'var(--danger-color)', boxShadow: '0 0 0 1px var(--danger-color)' } : {}}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
