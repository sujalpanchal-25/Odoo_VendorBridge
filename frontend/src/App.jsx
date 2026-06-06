import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Services & Actions
import { getMe } from './services/authApi.js';
import { setCredentials, logout } from './store/authSlice.js';
import { useSocket } from './hooks/useSocket.js';

// Layouts
import AppLayout from './components/layout/AppLayout.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';

// Pages - Auth
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';

// Pages - Dashboard & General
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Activity from './pages/Activity.jsx';

// Pages - Core ERP Features
import Vendors from './pages/Vendors.jsx';
import VendorDetail from './pages/VendorDetail.jsx';
import RFQs from './pages/RFQs.jsx';
import RFQDetail from './pages/RFQDetail.jsx';
import Quotations from './pages/Quotations.jsx';
import QuotationComparison from './pages/QuotationComparison.jsx';
import Approvals from './pages/Approvals.jsx';
import PurchaseOrders from './pages/PurchaseOrders.jsx';
import Invoices from './pages/Invoices.jsx';
import InvoiceDetail from './pages/InvoiceDetail.jsx';
import Reports from './pages/Reports.jsx';

export default function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Initialize Socket.io connection if logged in
  useSocket(user?.id);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await getMe();
          dispatch(setCredentials({ user: res.data.data }));
        } catch (e) {
          localStorage.removeItem('accessToken');
          dispatch(logout());
        }
      }
      setCheckingAuth(false);
    }

    checkAuth();

    // Listen to global logout events
    const handleGlobalLogout = () => {
      dispatch(logout());
    };
    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => window.removeEventListener('auth-logout', handleGlobalLogout);
  }, [dispatch]);

  if (checkingAuth) {
    // Pulse animation loading screen
    return (
      <div className="loading-screen">
        <div className="loading-logo">VendorBridge</div>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Private dashboard routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/activity" element={<Activity />} />
          
          {/* ERP routes */}
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/vendors/:id" element={<VendorDetail />} />
          <Route path="/rfqs" element={<RFQs />} />
          <Route path="/rfqs/:id" element={<RFQDetail />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/compare/:rfqId" element={<QuotationComparison />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
