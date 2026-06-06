import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../../services/authApi.js';
import { setCredentials } from '../../store/authSlice.js';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { showToast } from '../../components/common/Toast.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginApi({ email, password });
      const { accessToken, user } = res.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      dispatch(setCredentials({ user }));
      
      showToast('Welcome to VendorBridge!');
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>
        Sign In to Your Account
      </h2>

      {error && (
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 500 }}>
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" variant="primary" style={{ width: '100%', padding: '12px' }} loading={loading}>
        Sign In
      </Button>

      <div style={{ margin: '16px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
        or sign in with
      </div>

      <Button 
        type="button" 
        variant="secondary" 
        style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
        onClick={handleGoogleLogin}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707a5.41 5.41 0 010-3.414V4.961H.957a8.997 8.997 0 000 8.078l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.896 11.426 0 9 0A8.997 8.997 0 00.957 4.961l3.007 2.332c.708-2.127 2.692-3.713 5.036-3.713z" fill="#EA4335"/>
        </svg>
        Google Workspace
      </Button>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
        New to VendorBridge?{' '}
        <Link to="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
          Create an Account
        </Link>
      </div>
    </form>
  );
}
