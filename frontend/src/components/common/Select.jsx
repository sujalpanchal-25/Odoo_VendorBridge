import React from 'react';

export default function Select({ label, options = [], error, className = '', id, ...props }) {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 11)}`;
  return (
    <div className="form-group" style={{ width: '100%' }}>
      {label && <label htmlFor={selectId} className="form-label">{label}</label>}
      <select
        id={selectId}
        className={`form-control ${className}`}
        style={error ? { borderColor: 'var(--danger-color)', boxShadow: '0 0 0 1px var(--danger-color)' } : {}}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
