import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IKContext, IKUpload } from 'imagekitio-react';
import { User, Shield, Phone, MapPin, Info, Save, Upload } from 'lucide-react';

import { updateProfile } from '../services/authApi.js';
import { updateProfileSuccess } from '../store/authSlice.js';
import api from '../services/api.js';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { showToast } from '../components/common/Toast.jsx';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Form states
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || '');
  const [additionalInfo, setAdditionalInfo] = useState(user?.additionalInfo || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);

  // Status states
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      showToast('First and Last name are required', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfile({
        firstName,
        lastName,
        phone,
        country,
        additionalInfo,
        avatar
      });
      // Update local Redux state
      dispatch(updateProfileSuccess(res.data.data));
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>My Account Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Manage your personal details, workspace preferences, and profile credentials.
        </p>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left Column: Avatar & Summary Card */}
        <Card style={{ textAlign: 'center', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div 
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                backgroundColor: '#F1F5F9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid var(--border-color)',
                overflow: 'hidden'
              }}
            >
              {avatar?.url ? (
                <img src={avatar.url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} style={{ color: '#94A3B8' }} />
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{user?.firstName} {user?.lastName}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 600, marginTop: '2px' }}>
                Role: {user?.role}
              </p>
            </div>

            {/* Avatar Upload */}
            <IKContext
              publicKey={import.meta.env.VITE_IK_PUBLIC_KEY || 'developer-placeholder-public-key'}
              urlEndpoint={import.meta.env.VITE_IK_URL_ENDPOINT || 'https://ik.imagekit.io/developer-placeholder-endpoint'}
              authenticator={async () => {
                const res = await api.get('/upload/auth');
                return res.data.data;
              }}
            >
              <label 
                className="btn btn-secondary" 
                style={{ 
                  fontSize: '12px', 
                  padding: '6px 12px',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                <Upload size={14} style={{ marginRight: '6px' }} /> {uploading ? 'Uploading...' : 'Change Photo'}
                <IKUpload
                  folder="/avatars"
                  style={{ display: 'none' }}
                  onUploadStart={() => setUploading(true)}
                  onSuccess={(res) => {
                    setAvatar({ url: res.url, fileId: res.fileId, name: res.name });
                    setUploading(false);
                    showToast('Photo uploaded successfully');
                  }}
                  onError={() => {
                    setUploading(false);
                    showToast('Photo upload failed', 'error');
                  }}
                />
              </label>
            </IKContext>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>
              <strong>Email Address:</strong>
              <p style={{ color: 'var(--text-primary)', wordBreak: 'break-all', marginTop: '2px' }}>{user?.email}</p>
            </div>
            <div>
              <strong>System Role:</strong>
              <p style={{ color: 'var(--text-primary)', marginTop: '2px', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
        </Card>

        {/* Right Column: Profile Form */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
            Personal Details
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Phone Number"
                placeholder="+91 XXXXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Country"
                placeholder="India"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Additional Profile Information</label>
              <textarea
                className="form-control"
                placeholder="Write any additional details..."
                rows={4}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button type="submit" variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} loading={loading || uploading}>
                <Save size={16} /> Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
