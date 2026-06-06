import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  TrendingUp, 
  Building, 
  Download, 
  BarChart3, 
  PieChart as PieIcon, 
  FileSpreadsheet 
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
  BarChart,
  Bar
} from 'recharts';

import { getAnalytics, exportProcurementData } from '../services/reportApi.js';
import Card from '../components/common/Card.jsx';
import Table from '../components/common/Table.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { showToast } from '../components/common/Toast.jsx';

const COLORS = ['#0F172A', '#F59E0B', '#10B981', '#EF4444', '#64748B'];

export default function Reports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchReportsData() {
      try {
        const res = await getAnalytics();
        setAnalytics(res.data.data);
      } catch (err) {
        showToast('Error loading analytics reports', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchReportsData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      showToast('Exporting procurement report...');
      const res = await exportProcurementData();
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `procurement_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('CSV report exported!');
    } catch (err) {
      showToast('Failed to export CSV report', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <Spinner />
      </div>
    );
  }

  const pieData = analytics?.spendByCategory?.map(item => ({
    name: item._id || 'Uncategorized',
    value: item.totalSpend
  })) || [];

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '4px' }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Analyze spend analysis, category breakdowns, and export full audit database spreadsheets.
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} loading={exporting}>
          <FileSpreadsheet size={16} /> Export CSV Report
        </Button>
      </div>

      {/* Grid Charts */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Trend Area Chart */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} /> Monthly Procurement Volume Trend
          </h3>
          <div style={{ width: '100%', height: '320px' }}>
            {analytics?.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} style={{ fontSize: '12px', fill: 'var(--text-secondary)' }} />
                  <YAxis tickLine={false} style={{ fontSize: '12px', fill: 'var(--text-secondary)' }} />
                  <Tooltip 
                    formatter={(val) => [formatCurrency(val), 'Volume']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                  <Bar dataKey="total" fill="var(--accent-color)" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No spend trend data available.
              </div>
            )}
          </div>
        </Card>

        {/* Pie Category Chart */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} /> Industry Category Spend Distribution
          </h3>
          <div style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" style={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>No category spend data available.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Top Vendors performance table */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={18} /> Top Performing Suppliers Summary
        </h3>
        {analytics?.topVendors?.length > 0 ? (
          <Table headers={['Supplier Name', 'Industry Category', 'Orders Completed', 'Total Procurement Volume']}>
            {analytics.topVendors.map((v) => (
              <tr key={v._id}>
                <td style={{ fontWeight: 600 }}>{v.vendorDetails.companyName}</td>
                <td>{v.vendorDetails.category}</td>
                <td>{v.poCount} Orders</td>
                <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>{formatCurrency(v.totalSpend)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No supplier rankings available.
          </div>
        )}
      </Card>
    </div>
  );
}
