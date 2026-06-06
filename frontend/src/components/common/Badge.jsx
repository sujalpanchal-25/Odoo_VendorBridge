import React from 'react';

export default function Badge({ status = 'pending', className = '', children, ...props }) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  return (
    <span 
      className={`badge badge-${normalizedStatus} ${className}`}
      {...props}
    >
      {children || status}
    </span>
  );
}
