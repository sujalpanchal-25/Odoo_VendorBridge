import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AuthLayout() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const location = useLocation();
  
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const isRegister = location.pathname.includes('/register');
  const cardMaxWidth = isRegister ? '560px' : '420px';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--content-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: "var(--font-sans)",
    }}>
      {/* Logo Container */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
          {/* Minimalist Interconnected Bridge Logo Icon (Transparent BG) */}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left Node */}
            <circle cx="5" cy="12" r="3" fill="var(--brand-black)" />
            {/* Right Node */}
            <circle cx="19" cy="12" r="3" fill="var(--brand-black)" />
            {/* S-shaped Bridge Connection Curve */}
            <path d="M5 12C9 6 15 18 19 12" stroke="var(--brand-amber)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span style={{ 
            fontFamily: "var(--font-brand)", 
            fontSize: '25px', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            letterSpacing: '-0.04em' 
          }}>
            VendorBridge
          </span>
        </div>
      </div>

      {/* Modern minimal Form Card with dynamic width */}
      <div style={{
        width: '100%',
        maxWidth: cardMaxWidth,
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 36px',
        boxShadow: '0 4px 6px -1px rgba(9, 9, 11, 0.05), 0 10px 15px -3px rgba(9, 9, 11, 0.03)',
        transition: 'max-width 0.2s ease',
      }}>
        <Outlet />
      </div>

      <p style={{ marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.01em' }}>
        &copy; 2026 VendorBridge &middot; Enterprise Procurement Network
      </p>
    </div>
  );
}
