import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AuthLayout() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

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
          {/* Minimalist Professional Logo Icon (Transparent BG) */}
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bridge arch - dark charcoal for high visibility */}
            <path d="M6 22C10 14 22 14 26 22" stroke="var(--brand-black)" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Roadbed/horizontal line */}
            <path d="M4 22H28" stroke="var(--brand-black)" strokeWidth="2" strokeLinecap="round"/>
            {/* Vertical suspension hangers - brand amber highlights */}
            <path d="M11 17V22" stroke="var(--brand-amber)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 15V22" stroke="var(--brand-amber)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M21 17V22" stroke="var(--brand-amber)" strokeWidth="2" strokeLinecap="round"/>
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

      {/* Modern minimal Form Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 36px',
        boxShadow: '0 4px 6px -1px rgba(9, 9, 11, 0.05), 0 10px 15px -3px rgba(9, 9, 11, 0.03)',
      }}>
        <Outlet />
      </div>

      <p style={{ marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.01em' }}>
        &copy; 2026 VendorBridge &middot; Enterprise Procurement Network
      </p>
    </div>
  );
}
