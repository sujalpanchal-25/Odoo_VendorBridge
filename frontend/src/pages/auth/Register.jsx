import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { IKContext, IKUpload } from 'imagekitio-react';
import { register as registerApi, verifyOtp as verifyOtpApi } from '../../services/authApi.js';
import { setCredentials } from '../../store/authSlice.js';
import api from '../../services/api.js';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Button from '../../components/common/Button.jsx';
import { showToast } from '../../components/common/Toast.jsx';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Registration states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('officer');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [avatar, setAvatar] = useState(null);

  // Flow states
  const [isRegistered, setIsRegistered] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !role) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerApi({
        firstName,
        lastName,
        email,
        password,
        role,
        phone,
        country,
        additionalInfo,
        avatar
      });
      setIsRegistered(true);
      showToast('Registration successful! OTP has been sent to your email.');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please check your inputs.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtpApi({ email, otp });
      const { accessToken, user } = res.data.data;

      localStorage.setItem('accessToken', accessToken);
      dispatch(setCredentials({ user }));

      showToast('Account verified! Welcome to VendorBridge.');
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid or expired OTP.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {!isRegistered ? (
        <form onSubmit={handleRegisterSubmit}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>
            Create Your Account
          </h2>

          {/* Profile Photo Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '8px' }}>
            <div 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: '#F1F5F9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
              }}
            >
              {avatar ? (
                <img src={avatar.url} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Photo</span>
              )}
            </div>
            
            <IKContext
              publicKey={import.meta.env.VITE_IK_PUBLIC_KEY || 'developer-placeholder-public-key'}
              urlEndpoint={import.meta.env.VITE_IK_URL_ENDPOINT || 'https://ik.imagekit.io/developer-placeholder-endpoint'}
              authenticator={async () => {
                const res = await api.get('/upload/auth');
                return res.data.data;
              }}
            >
              <label 
                style={{ 
                  fontSize: '12px', 
                  color: 'var(--accent-color)', 
                  fontWeight: 600, 
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Picture'}
                <IKUpload
                  folder="/avatars"
                  style={{ display: 'none' }}
                  onUploadStart={() => setUploading(true)}
                  onSuccess={(res) => {
                    setAvatar({ url: res.url, fileId: res.fileId, name: res.name });
                    setUploading(false);
                    showToast('Picture uploaded successfully');
                  }}
                  onError={(err) => {
                    setUploading(false);
                    showToast('Upload failed', 'error');
                  }}
                />
              </label>
            </IKContext>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="First Name"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'officer', label: 'Procurement Officer' },
                { value: 'manager', label: 'Procurement Manager' },
                { value: 'vendor', label: 'Vendor Partner' },
                { value: 'admin', label: 'Administrator' }
              ]}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Input
            label="Country"
            placeholder="India"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />

          <div className="form-group">
            <label className="form-label">Additional Information</label>
            <textarea
              className="form-control"
              placeholder="Write any additional details about yourself..."
              rows={2}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <Button type="submit" variant="primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} loading={loading || uploading}>
            Register Account
          </Button>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
              Sign In
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
            Verify Your Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
            We've sent a 6-digit One-Time Verification code to your email <b>{email}</b>. Please enter it below.
          </p>

          <Input
            label="Verification Code (OTP)"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: 'bold' }}
          />

          <Button type="submit" variant="primary" style={{ width: '100%', padding: '12px', marginTop: '16px' }} loading={loading}>
            Verify & Create Account
          </Button>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
            <button
              type="button"
              onClick={() => setIsRegistered(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Go Back to Registration
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
