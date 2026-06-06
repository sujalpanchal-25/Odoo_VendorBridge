import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  DollarSign,
  FileText,
  CheckSquare,
  TrendingUp,
  Plus,
  Building,
  ArrowRight,
  Star,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { getDashboardStats, getAnalytics } from '../services/reportApi.js';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Table from '../components/common/Table.jsx';
import Spinner from '../components/common/Spinner.jsx';
import Button from '../components/common/Button.jsx';
import { showToast } from '../components/common/Toast.jsx';
import Modal from '../components/common/Modal.jsx';

const COLORS = ['#0F172A', '#F59E0B', '#10B981', '#EF4444', '#64748B'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoleAlert, setShowRoleAlert] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isVendor = user?.role === 'vendor';

  useEffect(() => {
    if (localStorage.getItem('showGoogleOAuthRoleAlert') === 'true') {
      setShowRoleAlert(true);
      localStorage.removeItem('showGoogleOAuthRoleAlert');
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Use allSettled so analytics 403 (vendor role) doesn't crash stats
        const [statsResult, analyticsResult] = await Promise.allSettled([
          getDashboardStats(),
          getAnalytics(),
        ]);

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value.data.data);
        } else {
          showToast('Could not load dashboard stats', 'error');
        }

        if (analyticsResult.status === 'fulfilled') {
          setAnalytics(analyticsResult.value.data.data);
        }
        // Analytics failure is silent (vendor role doesn't have access — expected)
      } catch (err) {
        showToast('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <Spinner />
      </div>
    );
  }

  // Pre-process category data for PieChart
  const pieData =
    analytics?.spendByCategory?.map((item) => ({
      name: item._id || 'Uncategorized',
      value: item.totalSpend,
    })) || [];

  // ── VENDOR DASHBOARD ────────────────────────────────────────────────────────
  if (isVendor || stats?.isVendor) {
    return (
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Welcome, {stats?.companyName || user?.firstName}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Your vendor portal — view assigned RFQs, track purchase orders &amp; earnings.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button onClick={() => navigate('/rfqs')} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} /> View My RFQs
            </Button>
          </div>
        </div>

        {/* Vendor status banner */}
        {stats?.vendorStatus && stats.vendorStatus !== 'active' && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              backgroundColor: stats.vendorStatus === 'pending' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${stats.vendorStatus === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: stats.vendorStatus === 'pending' ? 'var(--warning-color)' : 'var(--danger-color)',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ⚠️ Your vendor account status is <strong>{stats.vendorStatus}</strong>. Some features may be restricted until your account is approved by the admin.
          </div>
        )}

        {/* Vendor Stats Cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <Card style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Earnings This Month
                </p>
                <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(stats?.spendThisMonth)}</h3>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
                <DollarSign size={24} />
              </div>
            </div>
          </Card>

          <Card onClick={() => navigate('/rfqs')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Assigned RFQs
                </p>
                <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{stats?.activeRFQs || 0}</h3>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)' }}>
                <FileText size={24} />
              </div>
            </div>
          </Card>

          <Card onClick={() => navigate('/purchase-orders')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Total Orders
                </p>
                <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{stats?.totalOrders || 0}</h3>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                <Package size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Rating
                </p>
                <h3 style={{ fontSize: '24px', fontWeight: 700 }}>
                  {stats?.vendorRating ? `${stats.vendorRating} / 5` : 'N/A'}
                </h3>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-color)' }}>
                <Star size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent POs for vendor */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>My Recent Purchase Orders</h3>
            <button
              onClick={() => navigate('/purchase-orders')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          {stats?.recentPOs?.length > 0 ? (
            <Table headers={['PO Number', 'Grand Total', 'Status']}>
              {stats.recentPOs.map((po) => (
                <tr key={po._id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{po.poNumber}</td>
                  <td>{formatCurrency(po.grandTotal)}</td>
                  <td>
                    <Badge status={po.status}>{po.status}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No purchase orders issued to you yet.
            </div>
          )}
        </Card>

        <Modal
          isOpen={showRoleAlert}
          onClose={() => setShowRoleAlert(false)}
          title="Google Auth — Role Notice"
          maxWidth="480px"
        >
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-color)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              }}
            >
              <Building size={28} />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Registered as Procurement Role
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              You have logged in directly via Google. By default, you have been registered with the <strong>Procurement (Officer)</strong> role.
              <br /><br />
              If you need to access the platform as an <strong>Admin</strong> or <strong>Vendor</strong>, please first register an account manually.
            </p>
            <Button onClick={() => setShowRoleAlert(false)} variant="primary" style={{ width: '100%' }}>
              Got it, continue
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // ── INTERNAL ROLES DASHBOARD (Admin / Manager / Officer) ───────────────────
  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>Welcome to VendorBridge</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Monitor procurement cycles, RFQs, quotations, and approvals in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button onClick={() => navigate('/rfqs')} variant="secondary">
            View RFQs
          </Button>
          <Button onClick={() => navigate('/rfqs')} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create RFQ
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <Card style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Spend This Month
              </p>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(stats?.spendThisMonth)}</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card onClick={() => navigate('/rfqs')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Active RFQs
              </p>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{stats?.activeRFQs || 0}</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)' }}>
              <FileText size={24} />
            </div>
          </div>
        </Card>

        <Card onClick={() => navigate('/approvals')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Pending Approvals
              </p>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{stats?.pendingApprovals || 0}</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
              <CheckSquare size={24} />
            </div>
          </div>
        </Card>

        <Card onClick={() => navigate('/vendors')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Procurement Trend
              </p>
              <h3 style={{ fontSize: '24px', fontWeight: 700 }}>Active</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.05)', color: 'var(--primary-bg)' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} /> Monthly Spend Trend (INR)
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            {analytics?.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} style={{ fontSize: '12px', fill: 'var(--text-secondary)' }} />
                  <YAxis tickLine={false} style={{ fontSize: '12px', fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Spend']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--accent-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No spend data available yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={18} /> Spend by Category
          </h3>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" style={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>No category data available yet.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Purchase Orders & Top Vendors */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Card style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Purchase Orders</h3>
            <button
              onClick={() => navigate('/purchase-orders')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {stats?.recentPOs?.length > 0 ? (
            <Table headers={['PO Number', 'Vendor', 'Grand Total', 'Status']}>
              {stats.recentPOs.map((po) => (
                <tr key={po._id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{po.poNumber}</td>
                  <td>{po.vendor?.companyName || 'Unknown Vendor'}</td>
                  <td>{formatCurrency(po.grandTotal)}</td>
                  <td>
                    <Badge status={po.status}>{po.status}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No purchase orders found.
            </div>
          )}
        </Card>

        <Card style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Top Performing Vendors</h3>
          {analytics?.topVendors?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analytics.topVendors.map((v) => (
                <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px', height: '36px', borderRadius: '6px',
                        backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)',
                      }}
                    >
                      {v.vendorDetails?.companyName?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {v.vendorDetails?.companyName || 'Unknown Vendor'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {v.poCount} POs issued
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(v.totalSpend)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              No vendor data.
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showRoleAlert}
        onClose={() => setShowRoleAlert(false)}
        title="Google Auth — Role Notice"
        maxWidth="480px"
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-color)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
            }}
          >
            <Building size={28} />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Registered as Procurement Role
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
            You have logged in directly via Google. By default, you have been registered with the <strong>Procurement (Officer)</strong> role.
            <br /><br />
            If you need to access the platform as an <strong>Admin</strong> or <strong>Vendor</strong>, please first register an account manually using the registration form.
          </p>
          <Button onClick={() => setShowRoleAlert(false)} variant="primary" style={{ width: '100%' }}>
            Got it, continue
          </Button>
        </div>
      </Modal>
    </div>
  );
}
