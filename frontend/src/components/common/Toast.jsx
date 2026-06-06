import React from 'react';
import toast from 'react-hot-toast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const showToast = (message, type = 'success') => {
  toast.custom((t) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        padding: '14px 18px',
        borderRadius: '6px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderLeft: '4px solid',
        borderColor: type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--accent-color)',
        minWidth: '320px',
        maxWidth: '450px',
        transform: t.visible ? 'scale(1)' : 'scale(0.9)',
        opacity: t.visible ? 1 : 0,
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1 }}>
        {type === 'success' && <CheckCircle size={18} color="var(--success-color)" />}
        {type === 'error' && <AlertCircle size={18} color="var(--danger-color)" />}
        {type === 'info' && <Info size={18} color="var(--accent-color)" />}
        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{message}</span>
      </div>
      <button
        onClick={() => toast.dismiss(t.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          padding: 0
        }}
      >
        <X size={16} />
      </button>
    </div>
  ), { duration: 4000, position: 'top-right' });
};

export default function Toast() {
  return null;
}
