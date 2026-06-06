import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  ShoppingBag, 
  FileSpreadsheet, 
  BarChart2, 
  Activity 
} from 'lucide-react';
import { useSelector } from 'react-redux';

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'officer', 'manager', 'vendor'] },
    { label: 'Vendors', path: '/vendors', icon: Users, roles: ['admin', 'officer'] },
    { label: 'RFQs', path: '/rfqs', icon: FileText, roles: ['admin', 'officer', 'manager', 'vendor'] },
    { label: 'Quotations', path: '/quotations', icon: FileSpreadsheet, roles: ['vendor'] },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['admin', 'manager', 'officer'] },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingBag, roles: ['admin', 'officer', 'manager', 'vendor'] },
    { label: 'Invoices', path: '/invoices', icon: FileSpreadsheet, roles: ['admin', 'officer', 'manager', 'vendor'] },
    { label: 'Reports', path: '/reports', icon: BarChart2, roles: ['admin', 'officer', 'manager'] },
    { label: 'Activity Logs', path: '/activity', icon: Activity, roles: ['admin', 'officer', 'manager', 'vendor'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div 
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--sidebar-bg)',
        color: '#FFFFFF',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        borderRight: '1px solid #334155'
      }}
    >
      <div 
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid #334155'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Logo Icon with White Nodes for Dark Sidebar BG */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left Node */}
            <circle cx="5" cy="12" r="3" fill="#FFFFFF" />
            {/* Right Node */}
            <circle cx="19" cy="12" r="3" fill="#FFFFFF" />
            {/* S-shaped Bridge Connection Curve */}
            <path d="M5 12C9 6 15 18 19 12" stroke="var(--brand-amber)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span style={{ 
            fontFamily: "var(--font-brand)", 
            fontSize: '18px', 
            fontWeight: 800, 
            color: '#FFFFFF', 
            letterSpacing: '-0.04em' 
          }}>
            VendorBridge
          </span>
        </div>
      </div>

      <nav 
        style={{ 
          flexGrow: 1, 
          padding: '24px 12px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          overflowY: 'auto' 
        }}
      >
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: isActive ? 'var(--accent-color)' : '#94A3B8',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
